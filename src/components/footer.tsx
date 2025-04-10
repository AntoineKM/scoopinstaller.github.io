"use client";

import Link from "next/link";
import { GithubIcon, HandshakeIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background w-full">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <GithubIcon className="h-4 w-4" />
            <span>
              <Link
                href="https://github.com/ScoopInstaller"
                className="hover:underline text-primary"
              >
                Scoop
              </Link>{" "}
              created by{" "}
              <Link
                href="https://github.com/lukesampson"
                className="hover:underline text-primary"
              >
                lukesampson
              </Link>
            </span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <GithubIcon className="h-4 w-4" />
            <span>
              <Link
                href="https://github.com/ScoopInstaller/scoopinstaller.github.io"
                className="hover:underline text-primary"
              >
                Website
              </Link>{" "}
              created by{" "}
              <Link
                href="https://github.com/gpailler"
                className="hover:underline text-primary"
              >
                gpailler
              </Link>
            </span>
          </div>
          <div className="flex items-center justify-center md:justify-end gap-2">
            <HandshakeIcon className="h-4 w-4" />
            <span>
              Maintained by the{" "}
              <Link
                href="https://github.com/orgs/ScoopInstaller/people"
                className="hover:underline text-primary"
              >
                community
              </Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}