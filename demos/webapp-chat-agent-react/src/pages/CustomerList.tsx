import { sampleCustomers } from '../constants';

export function CustomerList() {
  return (
    <section className="card">
      <h2>客户列表</h2>
      <p className="muted">用于测试 Agent 从其他页面切换到新建页面，或读取列表信息。</p>
      <div className="table">
        <div className="table-row table-head"><span>姓名</span><span>公司</span><span>城市</span><span>等级</span></div>
        {sampleCustomers.map((customer) => (
          <div className="table-row" key={customer.name}>
            <span>{customer.name}</span><span>{customer.company}</span><span>{customer.city}</span><span>{customer.level}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
