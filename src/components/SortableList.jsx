import { Box } from '@mui/material';
import { DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const lockToVerticalAxis = ({ transform }) => ({ ...transform, x: 0 });

// Lista vertical reordenable arrastrando. Con mouse se arrastra desde cualquier parte del elemento
// (los botones internos siguen funcionando porque el arrastre empieza al mover 5px); en pantallas
// táctiles hay que mantener apretado un instante para no pelear con el scroll.
// `ids` define el orden; al soltar se llama onReorder(nuevosIds).
export default function SortableList({ ids, onReorder, disabled = false, children }) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)));
  };

  if (disabled) return children;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[lockToVerticalAxis]} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

// Elemento de una SortableList. `children` puede ser una función que recibe { dragging }.
export function SortableItem({ id, disabled = false, children, sx }) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({ id, disabled });

  return (
    <Box
      ref={setNodeRef}
      {...(disabled ? {} : listeners)}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        position: 'relative',
        zIndex: isDragging ? 2 : 'auto',
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        boxShadow: isDragging ? '0 10px 30px rgba(0,0,0,0.55)' : 'none',
        ...sx,
      }}
    >
      {typeof children === 'function' ? children({ dragging: isDragging }) : children}
    </Box>
  );
}
