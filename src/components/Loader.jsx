export default function Loader({ fullScreen = false, label = 'Loading...' }) {
  return (
    <div className={fullScreen ? 'loader-screen' : 'loader-inline'}>
      <div className="loader-spinner" />
      <p>{label}</p>
    </div>
  );
}
