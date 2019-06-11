<script>
	import { time } from './store.js';

	const formatter = new Intl.DateTimeFormat('en', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
</script>


<h1>{formatter.format($time)}</h1>
