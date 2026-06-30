<template>
  <div class="pa-demo-shell">
    <section class="hero compact">
      <p class="eyebrow">场景 A / SPA 应用 B</p>
      <h1>报表中心应用</h1>
      <p class="desc">这是第二个 SPA 子应用。用于验证 PageAgent 是否能连续跨多个内部应用路由操作。</p>
      <div class="actions">
        <button id="report-refresh" @click="refresh">刷新报表</button>
        <button id="report-export" @click="exported = true">模拟导出</button>
        <button @click="router.push('/page-agent-portal')">返回门户</button>
      </div>
    </section>

    <section class="panel">
      <h2>本月数据</h2>
      <div class="metrics">
        <div><strong>{{ metrics.orders }}</strong><span>订单数</span></div>
        <div><strong>{{ metrics.amount }}</strong><span>成交额</span></div>
        <div><strong>{{ metrics.rate }}</strong><span>转化率</span></div>
      </div>
      <p v-if="exported" class="success">已触发模拟导出。生产环境中导出/提交类动作应要求用户确认。</p>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const exported = ref(false);
  const metrics = reactive({ orders: 128, amount: '¥89,600', rate: '23%' });
  const refresh = () => {
    metrics.orders += 1;
    metrics.amount = '¥90,200';
    metrics.rate = '24%';
  };
</script>

<style scoped lang="less">
  @import './style.less';
</style>
