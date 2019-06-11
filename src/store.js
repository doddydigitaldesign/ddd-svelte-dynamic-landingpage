import { writable, readable } from 'svelte/store';

// Clock
export const time = readable(new Date(), function start(set) {
    const interval = setInterval(() => {
        set(new Date());
    }, 1000);

    return function stop() {
        clearInterval(interval);
    };
});

// User Name
export const inputName = writable('human');

// User Todo
export const todo = writable(['Default item',])