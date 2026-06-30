<template>
  <div class="pa-demo-shell">
    <section class="hero compact">
      <p class="eyebrow">场景 A / SPA 应用 A</p>
      <h1>客户中心应用</h1>
      <p class="desc">这是同一个 Vue SPA 内的子应用页面。PageAgent 没有卸载，应该可以继续点击、填写和路由跳转。</p>
      <div class="actions">
        <button id="spa-a-fill" @click="fillDemo">填入示例客户</button>
        <button id="spa-a-next" @click="router.push('/page-agent-app-b')">跳到 SPA 应用 B</button>
        <button @click="router.push('/page-agent-portal')">返回门户</button>
      </div>
    </section>

    <section class="panel">
      <h2>客户录入</h2>
      <label>客户名称 <input id="customer-name" v-model="form.name" placeholder="请输入客户名称" /></label>
      <label>联系人 <input id="customer-contact" v-model="form.contact" placeholder="请输入联系人" /></label>
      <label>跟进状态
        <select id="customer-status" v-model="form.status">
          <option>待跟进</option>
          <option>沟通中</option>
          <option>已成交</option>
        </select>
      </label>
      <button id="spa-a-save" @click="saved = true">保存客户</button>
      <p v-if="saved" class="success">已保存：{{ form.name }} / {{ form.contact }} / {{ form.status }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const saved = ref(false);
  const form = reactive({ name: '', contact: '', status: '待跟进' });
  const fillDemo = () => {
    form.name = 'PageAgent 测试客户';
    form.contact = '张三';
    form.status = '沟通中';
    saved.value = false;
  };
</script>

<style scoped lang="less">
  @import './style.less';
</style>
