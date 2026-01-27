export default function Home() {
  return (
    <main>
      <h1>{process.env.NEXT_PUBLIC_APP_NAME}</h1>
      <p>API: {process.env.NEXT_PUBLIC_API_URL}</p>
    </main>
  );
}