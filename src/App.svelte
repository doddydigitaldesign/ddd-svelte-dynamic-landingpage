<script>
  import { onMount } from "svelte";
  import { inputName, todo, time } from "./store.js";
  import Clock from "./Clock.svelte";
  import NameInput from "./NameInput.svelte";
  import Todo from "./Todo.svelte";

// Update greeting and background based on time of day -> see styling of <main>-tag below
  let hours = $time.getHours();
  let timeOfDay = "morning";
  let timesOfDay = ["morning", "afternoon", "evening"];
  let bgSrc = timeOfDay;
  if (hours < 12 && hours > 6) {
    // Morning
    timeOfDay = timesOfDay[0];
    bgSrc = timeOfDay;
  } else if (hours >= 12 && hours <= 18) {
    // Afternoon
    timeOfDay = timesOfDay[1];
    bgSrc = timeOfDay;
  } else if (hours < 6 && hours > 18) {
    timeOfDay = timesOfDay[2];
    bgSrc = timeOfDay;
  }
// Update store with user name and todos, also subscribe
  let inputName_value;
  let todo_value;
  const unsubscribe = [
    inputName.subscribe(value => {
      inputName_value = value;
    }),
    todo.subscribe(value => {
      todo_value = value;
    })
  ];
</script>

<style>
  @import url("https://fonts.googleapis.com/css?family=Quicksand:300,400,500,700&display=swap");

  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  :global(body) {
    font-family: "Quicksand", sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-width: 100vw;
    min-height: 100vh;
    color: white;
    background-color: rgb(0, 0, 0);
  }
  :global(h1) {
    font-family: "Quicksand", sans-serif;
    font-size: 4rem;
    font-weight: 900;
    margin-top: 10rem;
    margin-bottom: 3rem;
    text-shadow: 0px 0px 5px rgb(0, 0, 0);
  }
  :global(h2) {
    font-size: 3rem;
    margin-bottom: 5rem;
    opacity: 0.9;
    text-shadow: 0px 0px 5px rgb(0, 0, 0);
  }
  :global(h3) {
    font-size: 2rem;
    margin-top: 3rem;
    opacity: 0.9;
    text-shadow: 0px 0px 5px rgb(0, 0, 0);
  }
  :global(label) {
    font-size: 1rem;
    font-weight: 600;
    font-size: 1.2rem;
    text-shadow: 0px 0px 5px rgb(0, 0, 0);
  }
  :global(input) {
    border-top: none;
    border-left: none;
    border-right: none;
    border-bottom: 1px solid ghostwhite;
    background: none;
    color: white;
    font-family: "Quicksand", sans-serif;
    min-width: 30vw;
    text-shadow: 0px 0px 5px rgb(0, 0, 0);
  }
  :global(::placeholder) {
    color: white;
    font-family: "Quicksand", sans-serif;
    font-weight: 600;
    font-size: 1rem;
    text-shadow: 0px 0px 5px rgb(0, 0, 0);
  }
  :global(ul) {
    list-style-type: none;
    margin-top: 2rem;
  }
  :global(li) {
    font-family: "Quicksand", sans-serif;
    font-weight: bold;
    margin-top: 1rem;
    text-shadow: 0px 0px 5px rgb(0, 0, 0);
  }
</style>

<main
  id="mainId"
  style="background-size: 100% 100%; background-repeat: no-repeat;
  background-image: url({bgSrc}.jpg); background-attachment: fixed;
  background-position: center; width: 100vw; height: 100vh; box-shadow: inset
  0px 0px 50px 10px #000000">
  <Clock />
  <h2>Good {timeOfDay}, {inputName_value}!</h2>
  {#if inputName_value === 'human'}
    <NameInput />
  {:else}
    <Todo />
    <h3>Your todos</h3>
    <ul>
      {#each todo_value as item}
        <li>{item}</li>
      {/each}
    </ul>
  {/if}

</main>
