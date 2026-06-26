export function Reports() {
  return (
    <section className="card">
      <h2>数据报表</h2>
      <p className="muted">用于测试 Agent 页面切换和内容提取。</p>
      <div className="metrics">
        <div><strong>128</strong><span>客户总数</span></div>
        <div><strong>42</strong><span>本月新增</span></div>
        <div><strong>36%</strong><span>VIP 占比</span></div>
      </div>
      <pre>{`杭州：56\n上海：31\n北京：22\n深圳：19`}</pre>
    </section>
  );
}
