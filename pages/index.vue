<script setup>
import style from "./index.module.css";
import { useTodosStore } from "~/stores/todos";

const store = useTodosStore();
const list = computed(() => store.list);
const isLoading = ref(true);

onMounted(() => {
  store.loadFromStorage();
  isLoading.value = false;
});

const addItem = () => {
  const newList = [
    ...list.value,
    {
      id: Math.random().toString(36).slice(2, 9),
      title: "",
      todos: [],
    },
  ];
  store.updateList(newList);
  navigateTo(`/item/${newList[newList.length - 1].id}`);
};
</script>

<template>
  <div :class="style.empty" v-if="!list.length || isLoading">No items</div>
  <div :class="style.list" v-else>
    <NuxtLink
      :to="`/item/${item.id}`"
      :class="style.item"
      v-for="item in list"
      :key="item.id"
    >
      <div :class="style.content">
        <div :class="style.title">
          {{ item?.title }}
        </div>
        <button
          @click.stop.prevent="store.deleteItem(item.id)"
          :class="style.delete"
          class="button"
        >
          x
        </button>
        <div>
          <div :class="style.todo" v-for="todo in item.todos" :key="todo.id">
            <div
              class="checkbox"
              :class="todo.completed ? 'completed-checkbox' : ''"
            ></div>
            <p :class="todo.completed ? 'completed-text' : ''">
              {{ todo.text }}
            </p>
          </div>
        </div>
      </div>
    </NuxtLink>
  </div>
  <button @click="addItem" :class="style.add">+</button>
</template>
