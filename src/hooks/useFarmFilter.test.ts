import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFarmFilter } from './useFarmFilter';
import { useTenant } from '../contexts/TenantContext';

// Mock the TenantContext
vi.mock('../contexts/TenantContext', () => {
  const mockHook = vi.fn();
  return {
    useTenant: mockHook,
    useTenantFarm: mockHook,
    useTenantProfile: mockHook,
  };
});

describe('useFarmFilter', () => {
  const mockTenantId = '00000000-0000-4000-8000-000000000001';
  const mockFarmId1 = '00000000-0000-4000-8000-000000000002';
  const mockFarmId2 = '00000000-0000-4000-8000-000000000003';
  const mockInvalidId = 'invalid-uuid';

  // Mock Supabase query object with chainable methods
  const createMockQuery = () => ({
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Filter state management', () => {
    it('should return correct state in global mode with admin permissions', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: true,
        activeFarmId: null,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [{ id: mockFarmId1 }, { id: mockFarmId2 }],
        userProfile: {
          role: 'ADMIN',
          permissoes: ['all'],
        },
      });

      const { result } = renderHook(() => useFarmFilter());

      expect(result.current.isGlobalMode).toBe(true);
      expect(result.current.activeFarmId).toBeNull();
      expect(result.current.activeTenantId).toBe(mockTenantId);
      expect(result.current.canCreate).toBe(false);
    });

    it('should return correct state in specific farm mode', () => {
      const mockFarm = {
        id: mockFarmId1,
        name: 'Fazenda Teste',
        tenantId: mockTenantId,
      };

      (useTenant as any).mockReturnValue({
        isGlobalMode: false,
        activeFarmId: mockFarmId1,
        activeTenantId: mockTenantId,
        activeFarm: mockFarm,
        farms: [mockFarm],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());

      expect(result.current.isGlobalMode).toBe(false);
      expect(result.current.activeFarmId).toBe(mockFarmId1);
      expect(result.current.activeTenantId).toBe(mockTenantId);
      expect(result.current.activeFarm).toEqual(mockFarm);
      expect(result.current.canCreate).toBe(true);
    });

    it('should return canCreate as false when activeFarmId is invalid UUID', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: false,
        activeFarmId: mockInvalidId,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());

      expect(result.current.canCreate).toBe(false);
    });

    it('should return canCreate as false in global mode', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: true,
        activeFarmId: null,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'ADMIN',
          permissoes: ['all'],
        },
      });

      const { result } = renderHook(() => useFarmFilter());

      expect(result.current.canCreate).toBe(false);
    });
  });

  describe('Filter reset functionality', () => {
    it('should provide null insertPayload in global mode', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: true,
        activeFarmId: null,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'ADMIN',
          permissoes: ['all'],
        },
      });

      const { result } = renderHook(() => useFarmFilter());

      expect(result.current.insertPayload).toEqual({
        fazenda_id: null,
        tenant_id: mockTenantId,
      });
    });

    it('should provide valid insertPayload with farmId in specific mode', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: false,
        activeFarmId: mockFarmId1,
        activeTenantId: mockTenantId,
        activeFarm: { id: mockFarmId1 },
        farms: [],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());

      expect(result.current.insertPayload).toEqual({
        fazenda_id: mockFarmId1,
        tenant_id: mockTenantId,
      });
    });

    it('should provide null insertPayload with invalid farmId', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: false,
        activeFarmId: mockInvalidId,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());

      expect(result.current.insertPayload).toEqual({
        fazenda_id: null,
        tenant_id: mockTenantId,
      });
    });
  });

  describe('Filter application logic - applyFarmFilter', () => {
    it('should filter by tenant_id in global mode with admin permissions', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: true,
        activeFarmId: null,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'ADMIN',
          permissoes: ['all'],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      result.current.applyFarmFilter(mockQuery);

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should filter by farm IDs in global mode without global permission', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: true,
        activeFarmId: null,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [{ id: mockFarmId1 }, { id: mockFarmId2 }],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      result.current.applyFarmFilter(mockQuery);

      expect(mockQuery.in).toHaveBeenCalledWith('fazenda_id', [mockFarmId1, mockFarmId2]);
    });

    it('should filter by specific fazenda_id when not in global mode', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: false,
        activeFarmId: mockFarmId1,
        activeTenantId: mockTenantId,
        activeFarm: { id: mockFarmId1 },
        farms: [],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      result.current.applyFarmFilter(mockQuery);

      expect(mockQuery.eq).toHaveBeenCalledWith('fazenda_id', mockFarmId1);
    });

    it('should return empty results when activeTenantId is null in global mode', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: true,
        activeFarmId: null,
        activeTenantId: null,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'ADMIN',
          permissoes: ['all'],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      result.current.applyFarmFilter(mockQuery);

      expect(mockQuery.is).toHaveBeenCalledWith('tenant_id', null);
    });

    it('should return empty results when activeFarmId is null in specific mode', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: false,
        activeFarmId: null,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      result.current.applyFarmFilter(mockQuery);

      expect(mockQuery.is).toHaveBeenCalledWith('fazenda_id', null);
    });

    it('should handle invalid activeTenantId by returning null results', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: true,
        activeFarmId: null,
        activeTenantId: mockInvalidId,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'ADMIN',
          permissoes: ['all'],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      // Mock console.error to verify warning
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      result.current.applyFarmFilter(mockQuery);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[useFarmFilter] Invalid activeTenantId format',
        { activeTenantId: mockInvalidId }
      );
      expect(mockQuery.is).toHaveBeenCalledWith('tenant_id', null);

      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid activeFarmId by falling back to tenant filter', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: false,
        activeFarmId: mockInvalidId,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      result.current.applyFarmFilter(mockQuery);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[useFarmFilter] Invalid activeFarmId format', {
        activeFarmId: mockInvalidId,
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);

      consoleErrorSpy.mockRestore();
    });

    it('should return null results when no farms available in global mode without admin', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: true,
        activeFarmId: null,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      result.current.applyFarmFilter(mockQuery);

      expect(mockQuery.is).toHaveBeenCalledWith('fazenda_id', null);
    });

    it('should warn about invalid UUID in development mode', () => {
      // Set development mode
      vi.stubEnv('DEV', true);

      (useTenant as any).mockReturnValue({
        isGlobalMode: false,
        activeFarmId: mockInvalidId,
        activeTenantId: mockTenantId,
        activeFarm: { id: mockInvalidId },
        farms: [],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      result.current.applyFarmFilter(mockQuery);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useFarmFilter] Invalid activeFarmId detected'),
        expect.any(Object)
      );

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      vi.unstubAllEnvs();
    });
  });

  describe('Filter application logic - applyTenantFilter', () => {
    it('should filter by tenant_id for tenant-only tables', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: false,
        activeFarmId: mockFarmId1,
        activeTenantId: mockTenantId,
        activeFarm: { id: mockFarmId1 },
        farms: [],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      result.current.applyTenantFilter(mockQuery);

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should return null results when activeTenantId is null', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: false,
        activeFarmId: mockFarmId1,
        activeTenantId: null,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      result.current.applyTenantFilter(mockQuery);

      expect(mockQuery.is).toHaveBeenCalledWith('tenant_id', null);
    });

    it('should handle invalid activeTenantId by returning null results', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: false,
        activeFarmId: mockFarmId1,
        activeTenantId: mockInvalidId,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      result.current.applyTenantFilter(mockQuery);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[useFarmFilter] Invalid activeTenantId format',
        { activeTenantId: mockInvalidId }
      );
      expect(mockQuery.is).toHaveBeenCalledWith('tenant_id', null);

      consoleErrorSpy.mockRestore();
    });

    it('should work consistently regardless of global mode when filtering by tenant', () => {
      const globalModeConfig = {
        isGlobalMode: true,
        activeFarmId: null,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [],
        userProfile: {
          role: 'ADMIN',
          permissoes: ['all'],
        },
      };

      (useTenant as any).mockReturnValue(globalModeConfig);

      const { result: result1 } = renderHook(() => useFarmFilter());
      const mockQuery1 = createMockQuery();

      result1.current.applyTenantFilter(mockQuery1);

      // Now test in specific mode
      (useTenant as any).mockReturnValue({
        ...globalModeConfig,
        isGlobalMode: false,
        activeFarmId: mockFarmId1,
      });

      const { result: result2 } = renderHook(() => useFarmFilter());
      const mockQuery2 = createMockQuery();

      result2.current.applyTenantFilter(mockQuery2);

      // Both should filter by tenant_id
      expect(mockQuery1.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
      expect(mockQuery2.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });
  });

  describe('Edge cases and permissions', () => {
    it('should recognize Administrador role as having global permission', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: true,
        activeFarmId: null,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [{ id: mockFarmId1 }],
        userProfile: {
          role: 'Administrador',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      result.current.applyFarmFilter(mockQuery);

      // Should use tenant filter (admin permission)
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should recognize global_view permission', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: true,
        activeFarmId: null,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [{ id: mockFarmId1 }],
        userProfile: {
          role: 'USER',
          permissoes: ['global_view'],
        },
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      result.current.applyFarmFilter(mockQuery);

      // Should use tenant filter (global_view permission)
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', mockTenantId);
    });

    it('should work when userProfile is null', () => {
      (useTenant as any).mockReturnValue({
        isGlobalMode: true,
        activeFarmId: null,
        activeTenantId: mockTenantId,
        activeFarm: null,
        farms: [{ id: mockFarmId1 }],
        userProfile: null,
      });

      const { result } = renderHook(() => useFarmFilter());
      const mockQuery = createMockQuery();

      result.current.applyFarmFilter(mockQuery);

      // Without profile, should fall back to farm list filtering
      expect(mockQuery.in).toHaveBeenCalledWith('fazenda_id', [mockFarmId1]);
    });

    it('should return all exposed properties', () => {
      const mockFarm = { id: mockFarmId1 };
      const mockFarms = [mockFarm, { id: mockFarmId2 }];

      (useTenant as any).mockReturnValue({
        isGlobalMode: false,
        activeFarmId: mockFarmId1,
        activeTenantId: mockTenantId,
        activeFarm: mockFarm,
        farms: mockFarms,
        userProfile: {
          role: 'USER',
          permissoes: [],
        },
      });

      const { result } = renderHook(() => useFarmFilter());

      // Verify all properties are present
      expect(result.current).toHaveProperty('applyFarmFilter');
      expect(result.current).toHaveProperty('applyTenantFilter');
      expect(result.current).toHaveProperty('isGlobalMode');
      expect(result.current).toHaveProperty('activeFarmId');
      expect(result.current).toHaveProperty('activeTenantId');
      expect(result.current).toHaveProperty('activeFarm');
      expect(result.current).toHaveProperty('farms');
      expect(result.current).toHaveProperty('canCreate');
      expect(result.current).toHaveProperty('insertPayload');

      // Verify values
      expect(result.current.farms).toEqual(mockFarms);
      expect(result.current.activeFarm).toEqual(mockFarm);
    });
  });
});
