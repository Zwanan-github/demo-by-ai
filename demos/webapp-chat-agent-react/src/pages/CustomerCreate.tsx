import type { CustomerForm } from '../types';

export function CustomerCreate(props: {
  form: CustomerForm;
  savedResult: string;
  setForm: (form: CustomerForm) => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const { form, savedResult, setForm, onReset, onSave } = props;

  return (
    <>
      <section className="card">
        <h2>新建客户</h2>
        <div className="form-grid">
          <label>客户姓名<input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="例如：张三" /></label>
          <label>公司<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="例如：阿里巴巴" /></label>
          <label>城市<select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}><option value="">请选择</option><option value="杭州">杭州</option><option value="上海">上海</option><option value="北京">北京</option><option value="深圳">深圳</option></select></label>
          <label>客户等级<select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as CustomerForm['level'] })}><option value="普通">普通</option><option value="重要">重要</option><option value="VIP">VIP</option></select></label>
        </div>
        <div className="actions">
          <button onClick={onReset}>重置</button>
          <button className="primary" onClick={onSave}>保存客户</button>
        </div>
      </section>
      <section className="card">
        <h2>保存结果</h2>
        <pre>{savedResult}</pre>
      </section>
    </>
  );
}
