import React, {
  createContext,
  useContext,
  useReducer,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScaleBrand = 'TRUTEST' | 'GALLAGHER' | 'COIMMA' | 'DIGISTAR' | 'OUTRO';
export type ScaleConnectionType = 'BLUETOOTH' | 'USB';
export type ScaleStatus = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface ScaleState {
  status: ScaleStatus;
  brand: ScaleBrand;
  connectionType: ScaleConnectionType;
  deviceName: string | null;
  currentWeight: number | null;
  rawLog: string[];
  errorMessage: string | null;
}

type ScaleAction =
  | { type: 'SET_STATUS'; payload: ScaleStatus }
  | { type: 'SET_BRAND'; payload: ScaleBrand }
  | { type: 'SET_CONNECTION_TYPE'; payload: ScaleConnectionType }
  | { type: 'SET_DEVICE_NAME'; payload: string | null }
  | { type: 'EMIT_WEIGHT'; payload: number }
  | { type: 'ADD_LOG'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'DISCONNECT' };

// ─── GATT Constants ───────────────────────────────────────────────────────────
//
// Nordic UART Service (NUS) — used by Tru-Test S3, S5, XRS2, EziWeigh7
//   Service:        6e400001-b5a3-f393-e0a9-e50e24dcca9e
//   TX (write to):  6e400002-b5a3-f393-e0a9-e50e24dcca9e
//   RX (notify):    6e400003-b5a3-f393-e0a9-e50e24dcca9e  ← we subscribe here
//
// Gallagher FFE0 — used by Gallagher W20, W30
//   Service:        0000ffe0-0000-1000-8000-00805f9b34fb
//   Char (notify):  0000ffe1-0000-1000-8000-00805f9b34fb

const NORDIC_UART_SERVICE  = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NORDIC_UART_TX_CHAR  = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // write
const NORDIC_UART_RX_CHAR  = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // notify (scale → browser)
const GALLAGHER_SERVICE    = '0000ffe0-0000-1000-8000-00805f9b34fb';
const GALLAGHER_CHAR       = '0000ffe1-0000-1000-8000-00805f9b34fb';

// All service UUIDs we ever request — must be declared as optionalServices
// in EVERY filter entry so Chrome grants access, regardless of brand chosen.
const ALL_SERVICES = [NORDIC_UART_SERVICE, GALLAGHER_SERVICE];

// Device name prefixes by brand.
// Using 'acceptAllDevices' for brands where the BT name is highly variable,
// but always restricting with optionalServices to limit what Chrome exposes.
const BRAND_BT_OPTIONS: Record<ScaleBrand, RequestDeviceOptions> = {
  TRUTEST: {
    // Tru-Test advertises as: "TRU-TEST S3-XXXX", "EziWeigh7 XXXXXXXX",
    // "XRS2 XXXXXXXX", "TW-3 XXXXXXXX", "TW-5 XXXXXXXX", "EID XXXXXXXX"
    filters: [
      { namePrefix: 'TRU-TEST' },
      { namePrefix: 'EziWeigh' },
      { namePrefix: 'XRS2' },
      { namePrefix: 'S3-' },
      { namePrefix: 'S5-' },
      { namePrefix: 'TW-3' },
      { namePrefix: 'TW-5' },
      { namePrefix: 'EID' },
    ],
    optionalServices: ALL_SERVICES, // declare both so fallback service is accessible
  },
  GALLAGHER: {
    // Gallagher W20/W30 advertise as "W20-XXXXXXXX" or "Gallagher W20"
    filters: [
      { namePrefix: 'W20' },
      { namePrefix: 'W30' },
      { namePrefix: 'Gallagher' },
      { namePrefix: 'GAL-' },
    ],
    optionalServices: ALL_SERVICES,
  },
  COIMMA: {
    // Coimma uses BLE modules with generic names — allow all but restrict services
    acceptAllDevices: true,
    optionalServices: ALL_SERVICES,
  },
  DIGISTAR: {
    // Digistar BLE models advertise as "DST-XXXX" or "Digistar XXXX"
    filters: [
      { namePrefix: 'DST-' },
      { namePrefix: 'Digistar' },
    ],
    optionalServices: ALL_SERVICES,
  },
  OUTRO: {
    // Unknown brand — show all devices, try every known service
    acceptAllDevices: true,
    optionalServices: ALL_SERVICES,
  },
};

// ─── Weight Parser ────────────────────────────────────────────────────────────
//
// Formats handled per brand:
//
//  TRUTEST  │ "RW,0342.7,KG\r\n"   (new firmware, comma-separated)
//           │ "WI,0342.7,KG\r\n"   (alternate command)
//           │ "RW0342.7KG\r\n"     (old firmware, no separator)
//           │ "\x02RW0342.7KG\x03" (STX/ETX framing, control chars stripped)
//
//  GALLAGHER│ "$W,342.7,kg\r\n"    (standard Gallagher W20/W30)
//
//  COIMMA   │ "WT:342.7KG\r\n"     (Coimma protocol)
//           │ "342.7\r\n"          (raw numeric fallback)
//
//  DIGISTAR │ "P:342.7\r\n"        (Digistar standard)
//           │ "342.7\r\n"          (raw numeric fallback)
//
//  OUTRO    │ Any 2-4 digit number with optional decimal

export function parseWeightString(raw: string, brand: ScaleBrand): number | null {
  // Strip control bytes (STX, ETX, CR, LF, NUL, etc.) — keep printable ASCII
  const s = raw.replace(/[\x00-\x1F\x7F]/g, ' ').trim();
  let match: RegExpMatchArray | null = null;

  switch (brand) {
    case 'TRUTEST':
      // New firmware:  RW,0342.7,KG  or  WI,342.7,KG  (comma or space separator)
      // Old firmware:  RW0342.7KG                       (no separator, leading zero-padded)
      match =
        s.match(/(?:RW|WI)[,\s]+0*(\d+\.?\d*)[,\s]+KG/i) ??
        s.match(/(?:RW|WI)0*(\d{2,4}\.?\d*)\s*KG/i);
      break;

    case 'GALLAGHER':
      // $W,342.7,kg  or  $W 342.7 KG
      match = s.match(/\$W[,\s]+(\d+\.?\d*)[,\s]+KG?/i);
      break;

    case 'COIMMA':
      // WT:342.7KG  or  WT: 342.7 KG  or  bare numeric
      match =
        s.match(/WT[:\s]+(\d+\.?\d*)\s*KG?/i) ??
        s.match(/^(\d{2,4}\.?\d*)$/);
      break;

    case 'DIGISTAR':
      // P:342.7  or  bare numeric
      match =
        s.match(/P[:\s]+(\d+\.?\d*)/i) ??
        s.match(/^(\d{2,4}\.?\d*)$/);
      break;

    default:
      // Fallback: any 2-4 digit number with optional decimal
      match = s.match(/\b(\d{2,4}\.?\d*)\b/);
  }

  if (match?.[1]) {
    const peso = parseFloat(match[1]);
    // Sanity range: 5 kg (neonato) → 1500 kg (touro adulto)
    if (peso >= 5 && peso <= 1500) return Math.round(peso * 10) / 10;
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ts(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour12: false });
}

// BLE packets can be fragmented (MTU ≈ 20 bytes). This buffer accumulates
// partial lines and only calls the callback once a complete line is formed.
function makeBleLineBuffer(onLine: (line: string) => void): (chunk: string) => void {
  let buf = '';
  return (chunk: string) => {
    buf += chunk;
    const lines = buf.split(/\r?\n/);
    buf = lines.pop() ?? ''; // keep last incomplete fragment
    for (const line of lines) {
      if (line.trim()) onLine(line);
    }
    // Safety: if buffer grows > 256 chars without a newline (malformed protocol),
    // attempt to parse whatever we have and clear.
    if (buf.length > 256) {
      if (buf.trim()) onLine(buf);
      buf = '';
    }
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialState: ScaleState = {
  status: 'IDLE',
  brand: (localStorage.getItem('tauze_scale_brand') as ScaleBrand) || 'TRUTEST',
  connectionType:
    (localStorage.getItem('tauze_scale_type') as ScaleConnectionType) || 'BLUETOOTH',
  deviceName: null,
  currentWeight: null,
  rawLog: [],
  errorMessage: null,
};

function reducer(state: ScaleState, action: ScaleAction): ScaleState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload, errorMessage: null };
    case 'SET_BRAND':
      return { ...state, brand: action.payload };
    case 'SET_CONNECTION_TYPE':
      return { ...state, connectionType: action.payload };
    case 'SET_DEVICE_NAME':
      return { ...state, deviceName: action.payload };
    case 'EMIT_WEIGHT':
      return { ...state, currentWeight: action.payload };
    case 'ADD_LOG': {
      const log = [...state.rawLog, `[${ts()}] ${action.payload}`];
      return { ...state, rawLog: log.slice(-50) };
    }
    case 'SET_ERROR':
      return { ...state, status: 'ERROR', errorMessage: action.payload };
    case 'DISCONNECT':
      return {
        ...state,
        status: 'IDLE',
        deviceName: null,
        currentWeight: null,
        rawLog: [],
        errorMessage: null,
      };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface ScaleContextValue {
  state: ScaleState;
  setBrand: (brand: ScaleBrand) => void;
  setConnectionType: (type: ScaleConnectionType) => void;
  connectBluetooth: () => Promise<void>;
  connectSerial: (baudRate: number) => Promise<void>;
  disconnect: () => void;
}

const ScaleContext = createContext<ScaleContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ScaleProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Refs hold active hardware references across renders
  const btDeviceRef  = useRef<BluetoothDevice | null>(null);
  const btCharRef    = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const serialPortRef   = useRef<SerialPort | null>(null);
  const serialReaderRef = useRef<ReadableStreamDefaultReader<string> | null>(null);

  // ── Setters ───────────────────────────────────────────────────────────────

  const setBrand = useCallback((brand: ScaleBrand) => {
    dispatch({ type: 'SET_BRAND', payload: brand });
    localStorage.setItem('tauze_scale_brand', brand);
  }, []);

  const setConnectionType = useCallback((type: ScaleConnectionType) => {
    dispatch({ type: 'SET_CONNECTION_TYPE', payload: type });
    localStorage.setItem('tauze_scale_type', type);
  }, []);

  // ── Raw data handler (shared by BT and Serial) ────────────────────────────

  const handleRawData = useCallback((raw: string, brand: ScaleBrand) => {
    const clean = raw.replace(/[\r\n]/g, '↵').trim();
    if (!clean) return;
    dispatch({ type: 'ADD_LOG', payload: `RAW » ${clean}` });
    const peso = parseWeightString(raw, brand);
    if (peso !== null) {
      dispatch({ type: 'EMIT_WEIGHT', payload: peso });
      dispatch({ type: 'ADD_LOG', payload: `✓ PESO CAPTURADO: ${peso} kg` });
    }
  }, []);

  // ── GATT service discovery helper ─────────────────────────────────────────
  // Tries Nordic UART first (Tru-Test, most BLE scales), then Gallagher FFE0.
  // Both services are declared in optionalServices for all brands, so Chrome
  // will not throw SecurityError on either attempt.

  const discoverRxCharacteristic = async (
    server: BluetoothRemoteGATTServer,
    dispatchLog: (msg: string) => void,
  ): Promise<BluetoothRemoteGATTCharacteristic> => {
    try {
      const svc = await server.getPrimaryService(NORDIC_UART_SERVICE);
      const char = await svc.getCharacteristic(NORDIC_UART_RX_CHAR);
      dispatchLog('Serviço Nordic UART (NUS) detectado.');
      return char;
    } catch {
      // Nordic UART not available — try Gallagher FFE0
    }

    try {
      const svc = await server.getPrimaryService(GALLAGHER_SERVICE);
      const char = await svc.getCharacteristic(GALLAGHER_CHAR);
      dispatchLog('Serviço Gallagher FFE0 detectado.');
      return char;
    } catch {
      // Neither found
    }

    throw new Error(
      'Nenhum serviço de balança reconhecido encontrado no dispositivo. ' +
      'Verifique se a balança está no modo de transmissão.',
    );
  };

  // ── Bluetooth connection ──────────────────────────────────────────────────

  const connectBluetooth = useCallback(async () => {
    if (!('bluetooth' in navigator)) {
      toast.error('Web Bluetooth não suportado. Use Chrome ou Edge no desktop.');
      return;
    }

    const brand = state.brand;

    try {
      dispatch({ type: 'SET_STATUS', payload: 'CONNECTING' });
      dispatch({ type: 'ADD_LOG', payload: 'Abrindo seletor de dispositivos Bluetooth...' });

      const nav = navigator as any;
      const device: BluetoothDevice = await nav.bluetooth.requestDevice(
        BRAND_BT_OPTIONS[brand],
      );

      dispatch({ type: 'SET_DEVICE_NAME', payload: device.name ?? 'Dispositivo BT' });
      dispatch({ type: 'ADD_LOG', payload: `Dispositivo: ${device.name ?? 'sem nome'}` });
      dispatch({ type: 'ADD_LOG', payload: 'Conectando ao servidor GATT...' });

      btDeviceRef.current = device;

      // ── Auto-reconnect on unexpected disconnect ────────────────────────────
      // The 'gattserverdisconnected' event fires when BT signal is lost or
      // the scale is turned off. We attempt one silent reconnect before giving up.
      device.addEventListener('gattserverdisconnected', async () => {
        dispatch({ type: 'ADD_LOG', payload: 'Conexão perdida. Tentando reconectar...' });
        try {
          const server = await device.gatt!.connect();
          const dispLog = (msg: string) => dispatch({ type: 'ADD_LOG', payload: msg });
          const rxChar = await discoverRxCharacteristic(server, dispLog);
          await rxChar.startNotifications();
          btCharRef.current = rxChar;
          dispatch({ type: 'ADD_LOG', payload: '✓ Reconectado com sucesso.' });
          toast('Balança reconectada.', { icon: '🔄' });
        } catch {
          dispatch({ type: 'DISCONNECT' });
          toast.error(`Balança ${device.name ?? ''} desconectada. Reconexão falhou.`);
        }
      });

      const server = await device.gatt!.connect();
      dispatch({ type: 'ADD_LOG', payload: 'GATT conectado.' });

      const dispLog = (msg: string) => dispatch({ type: 'ADD_LOG', payload: msg });
      const rxChar = await discoverRxCharacteristic(server, dispLog);

      // ── BLE data handler with line buffer ─────────────────────────────────
      // BLE MTU is 20-247 bytes. Weight strings can be split across multiple
      // characteristic notifications. We buffer until we see \r\n or \n.
      // Using latin1 (ISO-8859-1) for maximum compatibility with older firmware
      // that may send byte values 0x80–0xFF in status fields.
      const decoder = new TextDecoder('latin1');
      const flushLine = makeBleLineBuffer((line) => handleRawData(line, brand));

      rxChar.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        if (target.value) {
          const chunk = decoder.decode(target.value, { stream: true });
          flushLine(chunk);
        }
      });

      await rxChar.startNotifications();
      btCharRef.current = rxChar;

      dispatch({ type: 'SET_STATUS', payload: 'CONNECTED' });
      dispatch({ type: 'ADD_LOG', payload: '✓ LINK ESTABELECIDO — AGUARDANDO PESAGEM...' });
      toast.success(`Balança ${device.name ?? ''} conectada!`);

      localStorage.setItem('tauze_scale_brand', brand);
      localStorage.setItem('tauze_scale_type', 'BLUETOOTH');
    } catch (err: any) {
      // User closed the device picker without selecting — not an error
      if (err.name === 'NotFoundError') {
        dispatch({ type: 'SET_STATUS', payload: 'IDLE' });
        return;
      }
      const msg = err.message ?? 'Erro desconhecido na conexão Bluetooth.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      toast.error(`Erro Bluetooth: ${msg}`);
      dispatch({ type: 'ADD_LOG', payload: `ERRO: ${msg}` });
    }
  }, [state.brand, handleRawData]);

  // ── Serial connection ─────────────────────────────────────────────────────

  const connectSerial = useCallback(async (baudRate: number) => {
    if (!('serial' in navigator)) {
      toast.error('Web Serial não suportado. Use Chrome ou Edge no desktop.');
      return;
    }

    const brand = state.brand;

    try {
      dispatch({ type: 'SET_STATUS', payload: 'CONNECTING' });
      dispatch({ type: 'ADD_LOG', payload: 'Abrindo seletor de porta serial...' });

      const nav = navigator as any;
      const port: SerialPort = await nav.serial.requestPort();
      await port.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none' });
      serialPortRef.current = port;

      const info = await port.getInfo();
      const vid = (info as any).usbVendorId?.toString(16).toUpperCase().padStart(4, '0') ?? '????';
      const pid = (info as any).usbProductId?.toString(16).toUpperCase().padStart(4, '0') ?? '????';
      const label = `USB Serial — VID:${vid} PID:${pid} @ ${baudRate} baud`;

      dispatch({ type: 'SET_DEVICE_NAME', payload: label });
      dispatch({ type: 'SET_STATUS', payload: 'CONNECTED' });
      dispatch({ type: 'ADD_LOG', payload: `✓ Porta aberta. ${label}` });
      dispatch({ type: 'ADD_LOG', payload: 'Aguardando dados da balança...' });
      toast.success(`Porta serial conectada a ${baudRate} baud.`);

      localStorage.setItem('tauze_scale_brand', brand);
      localStorage.setItem('tauze_scale_type', 'USB');

      // Pipe through TextDecoderStream using latin1 for RS-232 compatibility
      const textDecoder = new TextDecoderStream('latin1');
      const readableStreamClosed = port.readable!.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      let buffer = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (line.trim()) handleRawData(line, brand);
          }
        }
      } catch {
        // Reader cancelled on disconnect — expected
      } finally {
        reader.releaseLock();
        await readableStreamClosed.catch(() => {});
      }
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        dispatch({ type: 'SET_STATUS', payload: 'IDLE' });
        return;
      }
      const msg = err.message ?? 'Erro desconhecido na conexão serial.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      toast.error(`Erro Serial: ${msg}`);
      dispatch({ type: 'ADD_LOG', payload: `ERRO: ${msg}` });
    }
  }, [state.brand, handleRawData]);

  // ── Disconnect ────────────────────────────────────────────────────────────

  const disconnect = useCallback(async () => {
    if (btCharRef.current) {
      try { await btCharRef.current.stopNotifications(); } catch {}
      btCharRef.current = null;
    }
    if (btDeviceRef.current?.gatt?.connected) {
      try { btDeviceRef.current.gatt.disconnect(); } catch {}
      btDeviceRef.current = null;
    }
    if (serialReaderRef.current) {
      try { await serialReaderRef.current.cancel(); } catch {}
      serialReaderRef.current = null;
    }
    if (serialPortRef.current) {
      try { await serialPortRef.current.close(); } catch {}
      serialPortRef.current = null;
    }
    localStorage.removeItem('tauze_scale_brand');
    localStorage.removeItem('tauze_scale_type');
    dispatch({ type: 'DISCONNECT' });
    toast('Balança desconectada.', { icon: '🔌' });
  }, []);

  // ── Cleanup on provider unmount ───────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (btDeviceRef.current?.gatt?.connected) {
        try { btDeviceRef.current.gatt.disconnect(); } catch {}
      }
      if (serialReaderRef.current) {
        try { serialReaderRef.current.cancel(); } catch {}
      }
      if (serialPortRef.current) {
        try { serialPortRef.current.close(); } catch {}
      }
    };
  }, []);

  return (
    <ScaleContext.Provider
      value={{ state, setBrand, setConnectionType, connectBluetooth, connectSerial, disconnect }}
    >
      {children}
    </ScaleContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useScale(): ScaleContextValue {
  const ctx = useContext(ScaleContext);
  if (!ctx) throw new Error('useScale must be used inside <ScaleProvider>');
  return ctx;
}
