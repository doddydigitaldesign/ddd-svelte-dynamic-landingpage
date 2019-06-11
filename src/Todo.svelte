<script>
    import { todo } from './store.js';

    let todoInput = '';
    function pushTodo () {
        todo.update(array => array.concat(todoInput));
        todoInput = '';
    }
</script>
<label for="inputTodo">Add Todos</label>
<input name="inputTodo" type="text" bind:value={todoInput} on:change={pushTodo} placeholder="Add some todos" />