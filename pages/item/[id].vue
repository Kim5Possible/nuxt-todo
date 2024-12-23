<script setup>
import style from "./item.module.css";
import { useTodosStore } from "~/stores/todos";

const isLoading = ref(true);
const store = useTodosStore();
const { id } = useRoute().params;
const input = ref("");
const isEditing = ref(false);
const editingId = ref(null);
const isEditingTitle = ref(false);
const titleInput = ref("");
const title = computed(() => todoList.value?.title || "");

const todoList = computed(() => store.list.find((item) => item.id === id));
const originalTodos = ref(JSON.stringify(todoList.value));

const history = ref([]);
const currentIndex = ref(-1);
const createStateCopy = (state) => ({
  id: state.id,
  title: state.title || "",
  todos: state.todos.map(({ id, text, completed }) => ({
    id,
    text,
    completed,
  })),
});

// Update store
const updateStoreWithState = (state) => {
  store.updateList(
    store.list.map((item) =>
      item.id === id ? { ...item, ...createStateCopy(state) } : item
    )
  );
};

onMounted(() => {
  store.loadFromStorage();
  history.value = [createStateCopy(todoList.value)];
  currentIndex.value = 0;

  if (!todoList.value?.title) {
    isEditingTitle.value = true;
    titleInput.value = "";
  }
  isLoading.value = false;
});

// History, undo, redo
const saveToHistory = (newState) => {
  history.value = history.value.slice(0, currentIndex.value + 1);
  history.value.push(createStateCopy(newState));
  currentIndex.value++;
};

const undoChanges = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    const previousState = history.value[currentIndex.value];
    if (previousState) updateStoreWithState(previousState);
  }
};

const redoChanges = () => {
  if (currentIndex.value < history.value.length - 1) {
    currentIndex.value++;
    const nextState = history.value[currentIndex.value];
    if (nextState) updateStoreWithState(nextState);
  }
};

const canUndo = computed(() => currentIndex.value > 0);
const canRedo = computed(() => currentIndex.value < history.value.length - 1);

// Title editing
const editTitle = () => {
  if (!isEditingTitle.value) {
    titleInput.value = todoList.value.title;
    isEditingTitle.value = true;
  }
};
const vFocus = {
  mounted: (el) => el.focus(),
};

const saveTitle = () => {
  const updatedList = store.list.map((item) => {
    if (item.id === id) {
      const updatedItem = {
        ...item,
        title: titleInput.value.trim() || "",
      };
      return updatedItem;
    }
    return item;
  });
  store.updateList(updatedList);
  saveToHistory(todoList.value);
  isEditingTitle.value = false;
};

// Todo editing
const saveTodo = () => {
  if (input.value === "") return;

  const updatedList = [...store.list];
  const itemIndex = updatedList.findIndex((item) => item.id === id);

  if (isEditing.value) {
    updatedList[itemIndex].todos = updatedList[itemIndex].todos.map((todo) =>
      todo.id === editingId.value ? { ...todo, text: input.value } : todo
    );
    isEditing.value = false;
    editingId.value = null;
  } else {
    updatedList[itemIndex].todos.push({
      id: Math.random().toString(36).slice(2, 9),
      text: input.value,
      completed: false,
    });
  }

  store.updateList(updatedList);
  saveToHistory(todoList.value);
  input.value = "";
};

const deleteTodo = (todoId) => {
  const updatedList = [...store.list];
  const itemIndex = updatedList.findIndex((item) => item.id === id);
  updatedList[itemIndex].todos = updatedList[itemIndex].todos.filter(
    (todo) => todo.id !== todoId
  );
  store.updateList(updatedList);
  saveToHistory(todoList.value);
};

const editTodo = (todoId) => {
  const todo = todoList.value.todos.find((todo) => todo.id === todoId);
  input.value = todo.text;
  isEditing.value = true;
  editingId.value = todoId;
  document.querySelector("input").focus();
};

// Check if there are any changes
const hasChanges = computed(
  () => JSON.stringify(todoList.value) !== originalTodos.value
);

const isNoteEmpty = computed(() => {
  return (
    !todoList.value?.title &&
    (!todoList.value?.todos || todoList.value.todos.length === 0)
  );
});
const cancelAllChanges = () => {
  if (isNoteEmpty.value) {
    store.deleteItem(id);
    return navigateTo("/");
  }

  if (
    hasChanges.value &&
    !window.confirm(
      "Are you sure you want to cancel? All changes will be lost."
    )
  ) {
    return;
  }

  store.updateList(
    store.list.map((item) =>
      item.id === id ? JSON.parse(originalTodos.value) : item
    )
  );

  if (isNoteEmpty.value) {
    store.deleteItem(id);
    return navigateTo("/");
  }

  navigateTo("/");
};

const saveChanges = () => {
  if (isNoteEmpty.value) {
    store.deleteItem(id);
    navigateTo("/");
    return;
  }
  navigateTo("/");
};
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="todoList" :class="style.item">
    <div :class="style.flex">
      <span @click="cancelAllChanges" :class="style.edit">← Cancel</span>
      <span
        @click="
          () => {
            store.deleteItem(id);
            navigateTo('/');
          }
        "
        :class="style.edit"
        >Delete note</span
      >
    </div>
    <h1 :class="style.title" v-if="!isEditingTitle" @click="editTitle">
      {{ title }}
    </h1>
    <div v-else :class="style.title">
      <input
        v-model="titleInput"
        type="text"
        :class="style.input - title"
        @blur="saveTitle"
        @keyup.enter="saveTitle"
        v-focus
      />
    </div>
    <div :class="style.form">
      <input
        v-model="input"
        type="text"
        placeholder="What needs to be done?"
        required
        maxRows="{4}"
        :class="style.input"
      />
      <button @click="saveTodo" :class="style.add">
        {{ isEditing ? "Edit" : "Add" }}
      </button>
    </div>
    <div :class="style.flex" v-for="todo in todoList.todos" :key="todo.id">
      <div :class="style.text">
        <div
          @click="store.completeTodo(todo, id, saveToHistory)"
          class="checkbox"
          :class="todo.completed ? 'completed-checkbox' : ''"
        ></div>
        <p :class="todo.completed ? 'completed-text' : ''">
          {{ todo.text }}
        </p>
      </div>
      <div :class="style.actions">
        <span @click="editTodo(todo.id)" :class="style.edit">edit</span>
        <button @click="deleteTodo(todo.id)" class="button">x</button>
      </div>
    </div>
    <button @click="saveChanges" class="button" :disabled="!hasChanges">
      Save
    </button>
    <div :class="style.flex">
      <button @click="undoChanges" :disabled="!canUndo">←</button>
      <button @click="redoChanges" :disabled="!canRedo">→</button>
    </div>
  </div>
</template>
