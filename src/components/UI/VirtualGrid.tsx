import React, { useRef, useEffect, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

interface VirtualGridProps<T> {
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  itemHeight?: number;
  gap?: number;
  minColumnWidth?: number;
}

export function VirtualGrid<T>({
  data,
  renderItem,
  itemHeight = 200,
  gap = 16,
  minColumnWidth = 280,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        // Calculate how many columns fit
        const newCols = Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)));
        setColumns(newCols);
      }
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, [minColumnWidth, gap]);

  const rows = Math.ceil(data.length / columns);

  const virtualizer = useWindowVirtualizer({
    count: rows,
    estimateSize: () => itemHeight + gap,
    overscan: 2,
  });

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = data.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${itemHeight}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={startIndex + colIndex} style={{ width: '100%', height: '100%' }}>
                  {renderItem(item)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
