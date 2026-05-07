/**
 * Scale Integration Driver (Web Serial & Web Bluetooth)
 * Designed for industrial weighbridges and electronic scales.
 */

export interface ScaleData {
  weight: number;
  stable: boolean;
  unit: string;
}

export type ScaleCallback = (data: ScaleData) => void;

class ScaleDriver {
  private port: any = null;
  private reader: any = null;
  private keepReading = false;

  /**
   * Connect via Web Serial API (Most common for industrial indicators like Coimma, Toledo, etc.)
   */
  async connectSerial(callback: ScaleCallback): Promise<void> {
    try {
      // @ts-ignore
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 9600 });

      this.keepReading = true;
      const decoder = new TextDecoder();

      while (this.port.readable && this.keepReading) {
        this.reader = this.port.readable.getReader();
        try {
          while (true) {
            const { value, done } = await this.reader.read();
            if (done) break;
            
            const rawData = decoder.decode(value);
            const weight = this.parseWeight(rawData);
            
            if (weight !== null) {
              callback({
                weight,
                stable: rawData.includes('S'), // Simple heuristic for stability
                unit: 'kg'
              });
            }
          }
        } finally {
          this.reader.releaseLock();
        }
      }
    } catch (error) {
      console.error('Scale Connection Error:', error);
      throw error;
    }
  }

  /**
   * Connect via Web Bluetooth (For modern portable scales)
   */
  async connectBluetooth(callback: ScaleCallback): Promise<void> {
    try {
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['weight_scale'] }]
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('weight_scale');
      const characteristic = await service.getCharacteristic('weight_measurement');

      characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        // Standard Bluetooth Weight Scale profile parsing
        const weight = value.getUint16(1, true) / 10; 
        callback({ weight, stable: true, unit: 'kg' });
      });
    } catch (error) {
      console.error('Bluetooth Connection Error:', error);
      throw error;
    }
  }

  /**
   * Parse raw string from Serial (e.g., "ST,GS,+  125.5 kg")
   */
  private parseWeight(raw: string): number | null {
    const match = raw.match(/[-+]?\d*\.?\d+/);
    return match ? parseFloat(match[0]) : null;
  }

  disconnect() {
    this.keepReading = false;
    if (this.reader) this.reader.cancel();
  }
}

export const scaleDriver = new ScaleDriver();
