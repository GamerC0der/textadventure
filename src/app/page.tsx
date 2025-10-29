import Link from "next/link";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>Text Adventure Game</title>
        <meta name="description" content="Embark on a thrilling text-based journey." />
      </Head>

      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "black",
          color: "white",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "40px",
        }}
      >
        <h1
          style={{
            fontSize: "96px",
            marginBottom: "40px",
            lineHeight: "1.1",
          }}
        >
          Text Adventure Game
        </h1>

        <Link
          href="/start"
          style={{
            fontSize: "48px",
            color: "white",
            textDecoration: "none",
            border: "2px solid white",
            padding: "10px 30px",
            borderRadius: "8px",
            transition: "background-color 0.3s, color 0.3s",
          }}
        >
          Start
        </Link>
      </main>
    </>
  );
}