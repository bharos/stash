import OAuthSignin from "./OAuthSignin";

export default function Header() {
  return (
    <header className="w-full bg-white shadow-md p-4 z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-end items-center">
      <OAuthSignin />
    </div>
  </header>
  );
}
