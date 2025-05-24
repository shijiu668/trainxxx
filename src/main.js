// 从 Vue 3 核心库中导入 createApp 函数
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import pinia from './store'

// 创建Vue应用
const app = createApp(App)

// 使用插件
app.use(ElementPlus)
app.use(router)
app.use(pinia)

// 挂载应用,将 Vue 应用挂载到 HTML 文档中 id 为 app 的元素上。这个元素通常在 index.html 文件中定义
app.mount('#app')