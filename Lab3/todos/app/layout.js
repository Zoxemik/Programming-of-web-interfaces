import "./globals.css";

export const metadata = {
  title: "Planszowy Pchli Targ",
  description: "Aplikacja do handlu grami planszowymi"
};

export default function RootLayout(Props)
{
  return (
    <html lang="pl">
      <body>
        {Props.children}
      </body>
    </html>
  );
}