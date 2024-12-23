import { defineStore } from "pinia";

export const useTodosStore = defineStore("todos", {
  state: () => ({
    list: [],
  }),
  actions: {
    updateList(newList) {
      this.list = newList;
      if (import.meta.client) {
        localStorage.setItem("listTodo", JSON.stringify(newList));
      }
    },
    loadFromStorage() {
      if (import.meta.client) {
        const saved = localStorage.getItem("listTodo");
        this.list = saved ? JSON.parse(saved) : [];
      }
    },
    deleteItem(id) {
      if (!confirm("Are you sure you want to delete this item?")) return;
      this.updateList(this.list.filter((item) => item.id !== id));
    },
    completeTodo(todo, listId, saveToHistory) {
      const updatedList = this.list.map((item) => {
        if (item.id === listId) {
          const updatedTodos = item.todos.map((t) =>
            t.id === todo.id ? { ...t, completed: !t.completed } : t
          );
          return { ...item, todos: updatedTodos };
        }
        return item;
      });
      this.updateList(updatedList);
      if (saveToHistory) {
        saveToHistory(updatedList.find((item) => item.id === listId));
      }
    },
  },
});
