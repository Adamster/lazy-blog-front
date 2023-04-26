import Header from "./header";

const RootLayout = ({ children }: any) => {
  return (
    <>
      <html>
        <body>
          <Header />
          {children}
        </body>
      </html>
    </>
  );
};

export default RootLayout;
