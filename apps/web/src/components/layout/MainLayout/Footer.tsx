import { Text } from '@radix-ui/themes';

export default function Footer() {
  return (
    <footer className="mt-8 bg-white py-4">
      <div className="max-w-page mx-auto flex w-full justify-center gap-5 px-4 lg:px-0">
        <Text size="2" className="text-zinc-400">
          Xingliu @2026
        </Text>
      </div>
    </footer>
  );
}
