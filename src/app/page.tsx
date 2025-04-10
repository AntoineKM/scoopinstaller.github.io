import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { AsciinemaPlayer } from "@/components/asciinema-player";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/code-block";

export default function HomePage() {
  const CASTS_CONFIG = [
    { key: "nodejs", displayName: "Node.js", url: "/casts/nodejs.cast" },
    { key: "neovim", displayName: "Neovim", url: "/casts/neovim.cast" },
    { key: "vscode", displayName: "VS Code (extras)", url: "/casts/vscode.cast" },
    {
      key: "cascadia-code",
      displayName: "Cascadia Code (nerd-fonts)",
      url: "/casts/cascadia-code.cast",
    },
  ];
  
  return (
    <div className="container mx-auto px-4 py-16 md:px-6">
      <h1 className="text-4xl md:text-5xl font-bold text-center">Scoop</h1>
      <h2 className="text-xl md:text-2xl font-light text-center mt-2 mb-12">
        A command-line installer for Windows
      </h2>
      
      <div className="grid place-items-center mb-16">
        <div className="w-full max-w-2xl">
          <SearchBar />
        </div>
      </div>
      
      <section className="mb-16">
        <h3 className="text-2xl font-normal text-center mb-6">Quickstart</h3>
        <p className="text-center mb-4">
          Open a{" "}
          <abbr
            title="If you don't know what it is, don't worry, you can use the standard command line after installation. Just search for 'PowerShell' in the Start menu. Windows 7 users must install PowerShell version 5.1 or later manually."
            className="border-b border-dotted border-current no-underline"
          >
            PowerShell terminal
          </abbr>{" "}
          (version 5.1 or later) and from the PS C:\&gt; prompt, run:
        </p>
        
        <div className="mb-4">
          <CodeBlock
            language="powershell"
            code={`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression`}
          />
        </div>
        
        <p className="text-center">
          For advanced installation options, check out the{" "}
          <a 
            href="https://github.com/ScoopInstaller/Install#readme"
            className="text-primary hover:underline"
          >
            Installer&apos;s Readme
          </a>.
        </p>
      </section>
      
      <section className="mb-16">
        <h3 className="text-2xl font-normal text-center mb-8">
          What does Scoop do?
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <p className="mb-4">
              Scoop installs programs you know and love, from the command line with a minimal amount of friction. It:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Eliminates permission popup windows</li>
              <li>Hides GUI wizard-style installers</li>
              <li>Prevents PATH pollution from installing lots of programs</li>
              <li>Avoids unexpected side-effects from installing and uninstalling programs</li>
              <li>Finds and installs dependencies automatically</li>
              <li>Performs all the extra setup steps itself to get a working program</li>
            </ul>
          </div>
          <div>
            <AsciinemaPlayer casts={CASTS_CONFIG} />
          </div>
        </div>
      </section>
      
      <hr className="my-12" />
      
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="order-2 lg:order-1">
          <CodeBlock
            language="powershell"
            code={`> dir ~\\scoop

    Directory: C:\\Users\\User\\scoop

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
da---          02-04-2022    16:06                apps
d----          30-03-2022    13:22                buckets
d----          02-04-2022    16:06                cache
da---          30-03-2022    21:32                persist
da---          02-04-2022    16:06                shims
d----          20-02-2022    01:22                workspace`}
          />
        </div>
        <div className="order-1 lg:order-2 flex items-center">
          <p>
            Scoop downloads and manages packages in a portable way, keeping them neatly isolated in{" "}
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono">~\scoop</code>. 
            It won&apos;t install files outside its home, and you can place a
            Scoop installation wherever you like.
          </p>
        </div>
      </section>
      
      <hr className="my-12" />
      
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="flex items-center">
          <p>
            For terminal applications, Scoop creates <em>shims</em>, a kind of command-line shortcuts, inside the{" "}
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono">~\scoop\shims</code> folder, 
            which is accessible in the PATH. For graphical
            applications, Scoop creates program shortcuts in a dedicated Start menu folder, called &apos;Scoop
            Apps&apos;. This way, packages are always cleanly uninstalled and you can be sure what tools are currently
            in your PATH and in your Start menu.
          </p>
        </div>
        <div>
          <CodeBlock
            language="json"
            code={`> scoop search python
Results from local buckets...

Name      Version  Source Binaries
----      -------  ------ --------
python    3.10.5   main
winpython 3.10.4.0 main

> scoop install python
...
Creating shim for 'python.exe'.
'python' (3.10.5) was installed successfully!

> python -c "print('Hello from Python installed by Scoop!')"
Hello from Python installed by Scoop!`}
          />
        </div>
      </section>
      
      <section className="mb-16">
        <h3 className="text-2xl font-normal text-center mb-8">
          Discovering Packages
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <CodeBlock
              language="json"
              code={`> scoop search mongo
Results from local buckets...

Name                   Version Source Binaries
----                   ------- ------ --------
mongodb-compass        1.32.2  extras
mongosh                1.5.0   extras
mongodb-database-tools 100.5.3 main
mongodb                5.3.2   main

> scoop search citra
Results from other known buckets...
(add them using 'scoop bucket add <name>')

Name         Source
----         ------
citra-canary games
citra        games`}
            />
          </div>
          <div className="flex items-center">
            <div>
              <p className="mb-4">
                Scoop packages exist as a part of Git repositories, called <em>buckets</em>. In addition to the builtin{" "}
                <code className="bg-muted rounded px-1.5 py-0.5 font-mono">search</code> sub-command, the{" "}
                <Link 
                  href="/apps"
                  className="text-primary hover:underline"
                >
                  package search
                </Link>{" "}
                can be used to search all Scoop manifests on GitHub.
              </p>
              <p>
                The list of all Scoop buckets on GitHub can be browsed{" "}
                <Link 
                  href="/buckets"
                  className="text-primary hover:underline"
                >
                  here
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-16">
        <h3 className="text-2xl font-normal text-center mb-8">
          Creating Packages
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="flex items-center">
            <p>
              Scoop allows you to trivially create your own packages.
            </p>
          </div>
          <div>
            <CodeBlock
              language="powershell"
              code={`> scoop create https://example.com/foobar/1.2.3/foobar-package.zip
1) foobar
2) 1.2.3
3) foobar-package.zip
App name: 1
1) foobar
2) 1.2.3
3) foobar-package.zip
Version: 2
Created 'C:\\Users\\User\\Desktop\\foobar.json'.`}
            />
          </div>
        </div>
        
        <hr className="my-8" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <CodeBlock
              language="json"
              code={`> scoop cat gifski
{
    "version": "1.6.4",
    "description": "GIF encoder based on libimagequant (pngquant).",
    "homepage": "https://gif.ski",
    "license": "AGPL-3.0-or-later",
    "url": "https://gif.ski/gifski-1.6.4.zip",
    "hash": "dc97c92c9685742c4cf3de59ae12bcfcfa6ee08d97dfea26ea88728a388440cb",
    "pre_install": "if (!(Test-Path '$dir\\\\config')) { New-Item '$dir\\\\config' }",
    "bin": "gifski.exe",
    "checkver": "For Windows.*?gifski-([\\\\d.]+)\\\\.zip",
    "autoupdate": {
        "url": "https://gif.ski/gifski-$version.zip"
    }
}`}
            />
          </div>
          <div className="flex items-center">
            <p>
              Scoop manifests are simple JSON files, which can be optionally complemented with inline PowerShell
              statements.
            </p>
          </div>
        </div>
      </section>
      
      <section className="text-center mb-16">
        <h3 className="text-2xl font-normal mb-4">Documentation</h3>
        <p>
          Looking for something specific, or ready to dive into Scoop internals? Check out{" "}
          <a 
            href="https://github.com/ScoopInstaller/Scoop#readme"
            className="text-primary hover:underline"
          >
            Scoop&apos;s Readme
          </a>{" "}
          or refer to the{" "}
          <a 
            href="https://github.com/ScoopInstaller/Scoop/wiki"
            className="text-primary hover:underline"
          >
            Wiki
          </a>.
        </p>
      </section>
    </div>
  );
}