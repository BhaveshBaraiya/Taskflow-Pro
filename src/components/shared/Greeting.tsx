"use client";

import { useEffect, useState } from "react";

export default function Greeting({ name }: { name: string }) {

  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  return (
    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 transition-opacity animate-in fade-in">
      {greeting}, {name}
    </h1>
  );
}