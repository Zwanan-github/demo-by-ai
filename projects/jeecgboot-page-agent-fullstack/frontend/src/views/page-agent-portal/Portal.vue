<template>
  <div class="pa-demo-shell">
    <section class="hero">
      <p class="eyebrow">PageAgent 多应用门户测试</p>
      <h1>大门户跳转多个应用场景</h1>
      <p class="desc">
        这个页面用于验证 PageAgent 在不同跳转形态下的连续控制能力：SPA 路由、同源 iframe、整页跳转、新窗口。
      </p>
      <div class="prompt-box">
        <strong>推荐测试 Prompt：</strong>
        <span>请依次进入 SPA 应用、iframe 应用和整页跳转应用，告诉我每一步是否还能继续操作页面。</span>
      </div>
    </section>

    <section class="grid">
      <article class="card card-ok">
        <div class="tag">推荐 / 可连续</div>
        <h2>场景 A：SPA 内路由切换</h2>
        <p>门户和子应用都在同一个 Vue SPA 内，PageAgent 挂在 App.vue 顶层，不会卸载。</p>
        <ul>
          <li>不会刷新浏览器页面</li>
          <li>PageAgent Web Chat 保持在线</li>
          <li>适合门户 Shell + 内部应用路由</li>
        </ul>
        <button id="open-spa-app" @click="go('/page-agent-app-a')">进入 SPA 应用 A</button>
      </article>

      <article class="card card-mid">
        <div class="tag">取决于同源</div>
        <h2>场景 B：同源 iframe 子应用</h2>
        <p>门户不卸载，子应用放在 iframe 中。同源 iframe 有机会被读取和操作，跨域 iframe 会受浏览器限制。</p>
        <ul>
          <li>父页面 PageAgent 仍然存在</li>
          <li>同源 iframe 可作为验证样例</li>
          <li>跨域 iframe 通常无法访问 DOM</li>
        </ul>
        <button id="open-iframe-app" @click="go('/page-agent-iframe-shell')">进入 iframe 宿主页</button>
      </article>

      <article class="card card-warn">
        <div class="tag">会中断</div>
        <h2>场景 C：整页跳转到另一个应用</h2>
        <p>点击后浏览器导航到静态页面，Vue App 和 PageAgent 都会被卸载，只能完成“点击跳转”这一步。</p>
        <ul>
          <li>当前 PageAgent 上下文销毁</li>
          <li>跳转后页面没有聊天组件</li>
          <li>需要目标应用也集成 Agent 才能续接</li>
        </ul>
        <button id="open-fullpage-app" @click="goFullPage">整页跳转</button>
      </article>

      <article class="card card-warn">
        <div class="tag">新 Tab 边界</div>
        <h2>场景 D：新窗口 / 新 Tab</h2>
        <p>PageAgent 运行在当前页面，不能直接控制浏览器新打开的 tab。</p>
        <ul>
          <li>原页面 PageAgent 仍在</li>
          <li>新 Tab 没有当前 Agent 上下文</li>
          <li>需要浏览器扩展或目标页自行接入</li>
        </ul>
        <button id="open-newtab-app" @click="openNewTab">新 Tab 打开</button>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const go = (path: string) => router.push(path);
  const goFullPage = () => {
    window.location.href = '/page-agent-external-app.html?from=full-page';
  };
  const openNewTab = () => {
    window.open('/page-agent-external-app.html?from=new-tab', '_blank', 'noopener,noreferrer');
  };
</script>

<style scoped lang="less">
  @import './style.less';
</style>
