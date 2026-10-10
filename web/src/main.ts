import {createApp} from 'vue'
import PrimeVue from 'primevue/config';
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import 'primevue/resources/themes/aura-dark-lime/theme.css'
import 'primeflex/primeflex.css'
import 'primeicons/primeicons.css'

import 'highlight.js/styles/stackoverflow-dark.css'
import 'highlight.js/lib/common';
import hljsVuePlugin from '@highlightjs/vue-plugin'

import './style.css'
import App from './App.vue'

const app = createApp(App)
app.use(PrimeVue)
app.use(hljsVuePlugin)
app.component('TabView', TabView)
app.component('TabPanel', TabPanel)
app.component('Tag', Tag)
app.component('Message', Message)
app.component('InputText', InputText)
app.component('Dropdown', Dropdown)

app.mount('#app')
