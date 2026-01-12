"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Copy,
  Settings,
  Plus,
} from "lucide-react";
import { Notification } from "./UIComponents";
import { COMPONENT_LIBRARY } from "@/lib/component-library";

interface CanvasComponent {
  id: string;
  name: string;
  type: string;
  props: Record<string, any>;
}

interface CanvasBuilderProps {
  configId: string;
  onComponentsChange?: (components: CanvasComponent[]) => void;
}

function DraggableComponent({
  component,
  onDelete,
  onEdit,
  onDuplicate,
}: {
  component: CanvasComponent;
  onDelete: (id: string) => void;
  onEdit: (component: CanvasComponent) => void;
  onDuplicate: (component: CanvasComponent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow mb-3"
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners}>
          <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
        </div>

        <div className="flex-1">
          <p className="font-medium text-gray-900">{component.name}</p>
          <p className="text-sm text-gray-600">{component.type}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDuplicate(component)}
            className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(component)}
            className="p-2 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(component.id)}
            className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CanvasBuilder({
  configId,
  onComponentsChange,
}: CanvasBuilderProps) {
  const [components, setComponents] = useState<CanvasComponent[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedComponent, setSelectedComponent] =
    useState<CanvasComponent | null>(null);
  const [editingProps, setEditingProps] = useState<Record<string, any>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const addComponent = (componentName: string) => {
    const libraryComponent = COMPONENT_LIBRARY[componentName];
    if (!libraryComponent) return;

    const newComponent: CanvasComponent = {
      id: `component-${Date.now()}`,
      name: `${componentName} ${components.length + 1}`,
      type: componentName,
      props: libraryComponent.props || {},
    };

    const updated = [...components, newComponent];
    setComponents(updated);
    onComponentsChange?.(updated);
    setNotification({
      type: "success",
      message: `${componentName} added to canvas`,
    });
  };

  const deleteComponent = (id: string) => {
    const updated = components.filter((c) => c.id !== id);
    setComponents(updated);
    onComponentsChange?.(updated);
    setNotification({
      type: "success",
      message: "Component removed",
    });
  };

  const duplicateComponent = (component: CanvasComponent) => {
    const newComponent: CanvasComponent = {
      ...component,
      id: `component-${Date.now()}`,
      name: `${component.name} (copy)`,
    };

    const updated = [...components, newComponent];
    setComponents(updated);
    onComponentsChange?.(updated);
    setNotification({
      type: "success",
      message: "Component duplicated",
    });
  };

  const editComponent = (component: CanvasComponent) => {
    setSelectedComponent(component);
    setEditingProps(component.props);
  };

  const saveComponentEdit = () => {
    if (!selectedComponent) return;

    const updated = components.map((c) =>
      c.id === selectedComponent.id ? { ...c, props: editingProps } : c
    );
    setComponents(updated);
    onComponentsChange?.(updated);
    setSelectedComponent(null);
    setEditingProps({});
    setNotification({
      type: "success",
      message: "Component updated",
    });
  };

  const activeComponent = components.find((c) => c.id === activeId);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Component Palette */}
        <div className="lg:col-span-1 border-r border-gray-200 pr-6">
          <h3 className="text-lg font-bold mb-4">Components</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(COMPONENT_LIBRARY).map(([name]) => (
              <button
                key={name}
                onClick={() => addComponent(name)}
                className="w-full flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-3">
          <h3 className="text-lg font-bold mb-4">Canvas ({components.length})</h3>

          {components.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-600">
              <p>Drag components from the left or click to add them</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={(event) => {
                setActiveId(event.active.id as string);
              }}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={components.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {components.map((component) => (
                  <DraggableComponent
                    key={component.id}
                    component={component}
                    onDelete={deleteComponent}
                    onEdit={editComponent}
                    onDuplicate={duplicateComponent}
                  />
                ))}
              </SortableContext>

              <DragOverlay>
                {activeComponent ? (
                  <div className="bg-white border border-blue-500 rounded-lg p-4 shadow-lg opacity-80">
                    <p className="font-medium">{activeComponent.name}</p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          {/* Properties Editor */}
          {selectedComponent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h4 className="text-lg font-bold mb-4">
                  Edit {selectedComponent.name}
                </h4>

                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                  {Object.entries(editingProps).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setEditingProps({
                            ...editingProps,
                            [key]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveComponentEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setSelectedComponent(null)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
