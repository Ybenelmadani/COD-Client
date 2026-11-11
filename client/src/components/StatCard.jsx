export default function StatCard({ num, lbl, featured = false }) {
  return (
    <div className={`stat${featured ? " featured" : ""}`}>
      <div className="num">{num}</div>
      <div className="lbl">{lbl}</div>
    </div>
  );
}
