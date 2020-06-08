<script type="text/typescript">
    import { inputName } from './store.js';
    let name = '';
    function changeName() {
        inputName.set(name);
    }
</script>

<style>
    /* your styles go here */
</style>
<label for="inputName">Enter your name</label>
<input name="inputName" type="text" placeholder="Your name" bind:value={name} on:change={changeName}  />