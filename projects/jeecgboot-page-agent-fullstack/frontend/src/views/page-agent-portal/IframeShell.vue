<template>
  <div class="pa-demo-shell">
    <section class="hero compact">
      <p class="eyebrow">场景 B / iframe 宿主</p>
      <h1>同源 iframe 应用宿主页</h1>
      <p class="desc">PageAgent 仍挂在父页面。下面 iframe 是同源静态页面；如果换成跨域地址，浏览器会限制父页面读取内部 DOM。</p>
      <div class="actions">
        <button id="focus-iframe" @click="focused = true">标记准备操作 iframe</button>
        <button @click="router.push('/page-agent-portal')">返回门户</button>
      </div>
      <p v-if="focused" class="success">已标记：请让 PageAgent 尝试点击 iframe 里的“iframe 内按钮”。</p>
    </section>

    <iframe id="same-origin-agent-iframe" title="同源 iframe 子应用" src="/page-agent-iframe-app.html"></iframe>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const focused = ref(false);
</script>

<style scoped lang="less">
  @import './style.less';
</style>
