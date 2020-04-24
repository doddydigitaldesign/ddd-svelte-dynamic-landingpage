
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(component, store, callback) {
        const unsub = store.subscribe(callback);
        component.$$.on_destroy.push(unsub.unsubscribe
            ? () => unsub.unsubscribe()
            : unsub);
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    let outros;
    function group_outros() {
        outros = {
            remaining: 0,
            callbacks: []
        };
    }
    function check_outros() {
        if (!outros.remaining) {
            run_all(outros.callbacks);
        }
    }
    function on_outro(callback) {
        outros.callbacks.push(callback);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (!stop) {
                    return; // not ready
                }
                subscribers.forEach((s) => s[1]());
                subscribers.forEach((s) => s[0](value));
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                }
            };
        }
        return { set, update, subscribe };
    }

    // Clock
    const time = readable(new Date(), function start(set) {
        const interval = setInterval(() => {
            set(new Date());
        }, 1000);

        return function stop() {
            clearInterval(interval);
        };
    });

    // User Name
    const inputName = writable('human');

    // User Todo
    const todo = writable(['Default item',]);

    /* src\Clock.svelte generated by Svelte v3.5.1 */

    const file = "src\\Clock.svelte";

    function create_fragment(ctx) {
    	var h1, t_value = ctx.formatter.format(ctx.$time), t;

    	return {
    		c: function create() {
    			h1 = element("h1");
    			t = text(t_value);
    			add_location(h1, file, 12, 0, 203);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    			append(h1, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.$time) && t_value !== (t_value = ctx.formatter.format(ctx.$time))) {
    				set_data(t, t_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    			}
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $time;

    	validate_store(time, 'time');
    	subscribe($$self, time, $$value => { $time = $$value; $$invalidate('$time', $time); });

    	const formatter = new Intl.DateTimeFormat('en', {
    		hour12: false,
    		hour: '2-digit',
    		minute: '2-digit',
    		second: '2-digit'
    	});

    	return { formatter, $time };
    }

    class Clock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    /* src\NameInput.svelte generated by Svelte v3.5.1 */

    const file$1 = "src\\NameInput.svelte";

    function create_fragment$1(ctx) {
    	var label, t_1, input, dispose;

    	return {
    		c: function create() {
    			label = element("label");
    			label.textContent = "Enter your name";
    			t_1 = space();
    			input = element("input");
    			label.htmlFor = "inputName";
    			add_location(label, file$1, 11, 0, 204);
    			input.name = "inputName";
    			attr(input, "type", "text");
    			input.placeholder = "Your name";
    			add_location(input, file$1, 12, 0, 252);

    			dispose = [
    				listen(input, "input", ctx.input_input_handler),
    				listen(input, "change", ctx.changeName)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, label, anchor);
    			insert(target, t_1, anchor);
    			insert(target, input, anchor);

    			input.value = ctx.name;
    		},

    		p: function update(changed, ctx) {
    			if (changed.name && (input.value !== ctx.name)) input.value = ctx.name;
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(label);
    				detach(t_1);
    				detach(input);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let name = '';
        function changeName() {
            inputName.set(name);
        }

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate('name', name);
    	}

    	return { name, changeName, input_input_handler };
    }

    class NameInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    	}
    }

    /* src\Todo.svelte generated by Svelte v3.5.1 */

    const file$2 = "src\\Todo.svelte";

    function create_fragment$2(ctx) {
    	var label, t_1, input, dispose;

    	return {
    		c: function create() {
    			label = element("label");
    			label.textContent = "Add Todos";
    			t_1 = space();
    			input = element("input");
    			label.htmlFor = "inputTodo";
    			add_location(label, file$2, 9, 0, 204);
    			input.name = "inputTodo";
    			attr(input, "type", "text");
    			input.placeholder = "Add some todos";
    			add_location(input, file$2, 10, 0, 246);

    			dispose = [
    				listen(input, "input", ctx.input_input_handler),
    				listen(input, "change", ctx.pushTodo)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, label, anchor);
    			insert(target, t_1, anchor);
    			insert(target, input, anchor);

    			input.value = ctx.todoInput;
    		},

    		p: function update(changed, ctx) {
    			if (changed.todoInput && (input.value !== ctx.todoInput)) input.value = ctx.todoInput;
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(label);
    				detach(t_1);
    				detach(input);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let todoInput = '';
        function pushTodo () {
            todo.update(array => array.concat(todoInput));
            $$invalidate('todoInput', todoInput = '');
        }

    	function input_input_handler() {
    		todoInput = this.value;
    		$$invalidate('todoInput', todoInput);
    	}

    	return { todoInput, pushTodo, input_input_handler };
    }

    class Todo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    	}
    }

    /* src\App.svelte generated by Svelte v3.5.1 */

    const file$3 = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	return child_ctx;
    }

    // (124:2) {:else}
    function create_else_block(ctx) {
    	var t0, h3, t2, ul, current;

    	var todo_1 = new Todo({ $$inline: true });

    	var each_value = ctx.todo_value;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			todo_1.$$.fragment.c();
    			t0 = space();
    			h3 = element("h3");
    			h3.textContent = "Your todos";
    			t2 = space();
    			ul = element("ul");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			add_location(h3, file$3, 125, 4, 3306);
    			add_location(ul, file$3, 126, 4, 3331);
    		},

    		m: function mount(target, anchor) {
    			mount_component(todo_1, target, anchor);
    			insert(target, t0, anchor);
    			insert(target, h3, anchor);
    			insert(target, t2, anchor);
    			insert(target, ul, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.todo_value) {
    				each_value = ctx.todo_value;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			todo_1.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			todo_1.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			todo_1.$destroy(detaching);

    			if (detaching) {
    				detach(t0);
    				detach(h3);
    				detach(t2);
    				detach(ul);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (122:2) {#if inputName_value === 'human'}
    function create_if_block(ctx) {
    	var current;

    	var nameinput = new NameInput({ $$inline: true });

    	return {
    		c: function create() {
    			nameinput.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(nameinput, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			nameinput.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			nameinput.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			nameinput.$destroy(detaching);
    		}
    	};
    }

    // (128:6) {#each todo_value as item}
    function create_each_block(ctx) {
    	var li, t_value = ctx.item, t;

    	return {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			add_location(li, file$3, 128, 8, 3379);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.todo_value) && t_value !== (t_value = ctx.item)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	var main, t0, h2, t1, t2, t3, t4, t5, t6, current_block_type_index, if_block, current;

    	var clock = new Clock({ $$inline: true });

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.inputName_value === 'human') return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			main = element("main");
    			clock.$$.fragment.c();
    			t0 = space();
    			h2 = element("h2");
    			t1 = text("Good ");
    			t2 = text(ctx.timeOfDay);
    			t3 = text(", ");
    			t4 = text(ctx.inputName_value);
    			t5 = text("!");
    			t6 = space();
    			if_block.c();
    			add_location(h2, file$3, 120, 2, 3174);
    			main.id = "mainId";
    			set_style(main, "background-size", "100% 100%");
    			set_style(main, "background-repeat", "no-repeat");
    			set_style(main, "background-image", "url(" + ctx.bgSrc + ".jpg)");
    			set_style(main, "background-attachment", "fixed");
    			set_style(main, "background-position", "center");
    			set_style(main, "width", "100vw");
    			set_style(main, "height", "100vh");
    			set_style(main, "box-shadow", "inset\r\n  0px 0px 50px 10px #000000");
    			add_location(main, file$3, 113, 0, 2890);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			mount_component(clock, main, null);
    			append(main, t0);
    			append(main, h2);
    			append(h2, t1);
    			append(h2, t2);
    			append(h2, t3);
    			append(h2, t4);
    			append(h2, t5);
    			append(main, t6);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.timeOfDay) {
    				set_data(t2, ctx.timeOfDay);
    			}

    			if (!current || changed.inputName_value) {
    				set_data(t4, ctx.inputName_value);
    			}

    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				on_outro(() => {
    					if_blocks[previous_block_index].d(1);
    					if_blocks[previous_block_index] = null;
    				});
    				if_block.o(1);
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				if_block.i(1);
    				if_block.m(main, null);
    			}

    			if (!current || changed.bgSrc) {
    				set_style(main, "background-image", "url(" + ctx.bgSrc + ".jpg)");
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			clock.$$.fragment.i(local);

    			if (if_block) if_block.i();
    			current = true;
    		},

    		o: function outro(local) {
    			clock.$$.fragment.o(local);
    			if (if_block) if_block.o();
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			clock.$destroy();

    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $time;

    	validate_store(time, 'time');
    	subscribe($$self, time, $$value => { $time = $$value; $$invalidate('$time', $time); });

    	

    // Update greeting and background based on time of day -> see styling of <main>-tag below
      let hours = $time.getHours();
      let timeOfDay = "morning";
      let timesOfDay = ["morning", "afternoon", "evening"];
      let bgSrc = timeOfDay;
      if (hours < 12 && hours > 6) {
        // Morning
        $$invalidate('timeOfDay', timeOfDay = timesOfDay[0]);
        $$invalidate('bgSrc', bgSrc = timeOfDay);
      } else if (hours >= 12 && hours <= 18) {
        // Afternoon
        $$invalidate('timeOfDay', timeOfDay = timesOfDay[1]);
        $$invalidate('bgSrc', bgSrc = timeOfDay);
      } else if (hours < 6 && hours > 18) {
        $$invalidate('timeOfDay', timeOfDay = timesOfDay[2]);
        $$invalidate('bgSrc', bgSrc = timeOfDay);
      }
    // Update store with user name and todos, also subscribe
      let inputName_value;
      let todo_value;
      const unsubscribe = [
        inputName.subscribe(value => {
          $$invalidate('inputName_value', inputName_value = value);
        }),
        todo.subscribe(value => {
          $$invalidate('todo_value', todo_value = value);
        })
      ];

    	return {
    		timeOfDay,
    		bgSrc,
    		inputName_value,
    		todo_value
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
