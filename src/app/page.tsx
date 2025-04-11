import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { AsciinemaPlayer } from "@/components/asciinema-player";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/code-block";
import { 
  ArrowRight, 
  Download, 
  ShieldCheck, 
  Workflow, 
  Layers, 
  FolderOpen, 
  PackageOpen, 
  Terminal, 
  Github,
  FileCode,
  Search as SearchIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const CASTS_CONFIG = [
    { key: "nodejs", displayName: "Node.js", url: "/casts/nodejs.cast" },
    { key: "neovim", displayName: "Neovim", url: "/casts/neovim.cast" },
    { key: "vscode", displayName: "VS Code", url: "/casts/vscode.cast" },
    { key: "cascadia-code", displayName: "Cascadia Code", url: "/casts/cascadia-code.cast" },
  ];
  
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background pt-16 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4 px-3 py-1 text-sm">
              <Terminal className="mr-1 h-3.5 w-3.5" />
              Windows Package Manager
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
              Scoop
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              A powerful command-line installer for Windows
            </p>
            
            <div className="w-full max-w-2xl mx-auto mb-8">
              <SearchBar />
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="#quickstart">
                  Get Started <Download className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/apps">
                  Browse Packages <SearchIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Scoop?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Scoop provides a frictionless way to install programs on Windows, focusing on simplicity, control, and reliability.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Admin Required</h3>
              <p className="text-muted-foreground">
                Installs applications to your home directory, eliminating permission popup windows and admin requirements.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Workflow className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Clean PATH Management</h3>
              <p className="text-muted-foreground">
                Prevents PATH pollution by creating shims in a single directory, keeping your environment clean and organized.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Automatic Dependencies</h3>
              <p className="text-muted-foreground">
                Automatically finds and installs dependencies, making complex software installations quick and hassle-free.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Organized Structure</h3>
              <p className="text-muted-foreground">
                Keeps all packages neatly isolated with clear separation between apps, shims, and persistent data.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <PackageOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Updates</h3>
              <p className="text-muted-foreground">
                Simple commands for updating individual packages or all installed applications at once.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <FileCode className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Simple Manifests</h3>
              <p className="text-muted-foreground">
                Package definitions are simple JSON files, making it easy to create, modify, and share your own packages.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Quickstart Section */}
      <section id="quickstart" className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Get Started with Scoop</h2>
            
            <div className="bg-card border rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">1. Open PowerShell</h3>
              <p className="mb-4">
                Open a PowerShell terminal (version 5.1 or later) and run the following commands:
              </p>
              <CodeBlock
                language="powershell"
                code={`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression`}
                className="mb-4"
              />
              <p className="text-sm text-muted-foreground">
                This will install Scoop to your home directory and make it available in your terminal.
                For advanced options, check out the{" "}
                <a 
                  href="https://github.com/ScoopInstaller/Install#readme"
                  className="text-primary hover:underline"
                >
                  Installer's README
                </a>.
              </p>
            </div>
            
            <div className="bg-card border rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">2. Try Installing a Package</h3>
              <p className="mb-4">
                Now you can install any package by running:
              </p>
              <CodeBlock
                language="powershell"
                code="scoop install git"
                className="mb-4"
              />
              <p className="text-sm text-muted-foreground">
                This example installs Git, a popular version control system. The package will be installed in your user directory without admin rights.
              </p>
            </div>
            
            <div className="bg-card border rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">3. Add More Buckets (Optional)</h3>
              <p className="mb-4">
                Scoop comes with a default "main" bucket, but you can add more for additional packages:
              </p>
              <CodeBlock
                language="powershell"
                code="scoop bucket add extras"
                className="mb-4"
              />
              <p className="text-sm text-muted-foreground">
                This adds the "extras" bucket which contains GUI applications and other software not included in the main bucket.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">See Scoop in Action</h2>
              <p className="mb-6 text-lg">
                Scoop makes software installation on Windows as simple as it should be. Watch how quickly you can install popular development tools without GUI installers or annoying popups.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <div className="mr-2 mt-1 bg-primary/10 rounded-full p-1">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <span>No clicking through installation wizards</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 bg-primary/10 rounded-full p-1">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <span>No administrator privileges required</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 bg-primary/10 rounded-full p-1">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <span>Consistent install, update, and uninstall experience</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 bg-primary/10 rounded-full p-1">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <span>Automatic path configuration</span>
                </li>
              </ul>
              
              <div className="flex flex-wrap gap-4">
                <Button asChild>
                  <Link href="/apps">
                    Browse Available Packages
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/buckets">
                    Explore Buckets
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="bg-card border rounded-xl p-4">
              <AsciinemaPlayer casts={CASTS_CONFIG} />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">How Scoop Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div className="bg-card rounded-xl border shadow-sm p-6">
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
            
            <div>
              <h3 className="text-2xl font-semibold mb-4">Clean and Organized</h3>
              <p className="text-lg mb-4">
                Scoop downloads and manages packages in a portable way, keeping them neatly isolated in your user directory.
              </p>
              <p className="mb-6">
                It won't install files outside its home directory, and you can place a Scoop installation wherever you like. This gives you complete control over your software.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="font-mono bg-primary/10 px-2 py-0.5 rounded text-sm">apps</span>
                  <span className="text-muted-foreground">Where programs are installed</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-mono bg-primary/10 px-2 py-0.5 rounded text-sm">shims</span>
                  <span className="text-muted-foreground">Command shortcuts added to PATH</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-mono bg-primary/10 px-2 py-0.5 rounded text-sm">persist</span>
                  <span className="text-muted-foreground">Data that persists between updates</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h3 className="text-2xl font-semibold mb-4">Simple Package Management</h3>
              <p className="text-lg mb-4">
                Finding and installing software is as easy as searching and running a single command.
              </p>
              <p className="mb-6">
                Scoop creates shims for terminal applications and program shortcuts in the Start menu for graphical applications. This way, packages are always cleanly uninstalled, and you always know what's in your PATH.
              </p>
              <div className="flex gap-4">
                <Button asChild>
                  <Link href="/apps">
                    Search Packages
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="bg-card rounded-xl border shadow-sm p-6 order-1 md:order-2">
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
          </div>
        </div>
      </section>

      {/* Create Your Own Packages */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Create Your Own Packages</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Scoop manifests are simple JSON files, making it easy to create and share your own packages.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <CodeBlock
                language="json"
                code={`{
    "version": "1.6.4",
    "description": "GIF encoder based on libimagequant (pngquant).",
    "homepage": "https://gif.ski",
    "license": "AGPL-3.0-or-later",
    "url": "https://gif.ski/gifski-1.6.4.zip",
    "hash": "dc97c92c9685742c4cf3de59ae12bcfcfa6ee08d97dfea26ea88728a388440cb",
    "bin": "gifski.exe",
    "checkver": "For Windows.*?gifski-([\\\\d.]+)\\\\.zip",
    "autoupdate": {
        "url": "https://gif.ski/gifski-$version.zip"
    }
}`}
              />
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold mb-4">Simple JSON Manifest Format</h3>
              <p className="mb-4">
                Creating a new package for Scoop is as simple as defining a JSON manifest with basic information like:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <div className="mr-2 mt-1 bg-primary/10 rounded-full p-1">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Download URL and hash</span>
                    <p className="text-sm text-muted-foreground">Where to download the program and verify its integrity</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 bg-primary/10 rounded-full p-1">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Binary paths</span>
                    <p className="text-sm text-muted-foreground">Which executables should be added to your path</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 bg-primary/10 rounded-full p-1">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Version checking</span>
                    <p className="text-sm text-muted-foreground">Rules for checking for new versions</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 bg-primary/10 rounded-full p-1">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold">Auto-update configuration</span>
                    <p className="text-sm text-muted-foreground">How to generate new manifests for updates</p>
                  </div>
                </li>
              </ul>
              
              <Button asChild>
                <a href="https://github.com/ScoopInstaller/Scoop/wiki/App-Manifests" target="_blank" rel="noopener noreferrer">
                  Learn About Manifests <Github className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Documentation & Resources</h2>
            <p className="text-lg mb-8">
              Looking for something specific, or ready to dive into Scoop internals? Check out these resources:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <a 
                href="https://github.com/ScoopInstaller/Scoop#readme" 
                className="bg-card hover:bg-accent/50 border rounded-xl p-6 flex flex-col items-center transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">GitHub Repository</h3>
                <p className="text-sm text-muted-foreground text-center">
                  View the source code, report issues, and contribute to Scoop.
                </p>
              </a>
              
              <a 
                href="https://github.com/ScoopInstaller/Scoop/wiki" 
                className="bg-card hover:bg-accent/50 border rounded-xl p-6 flex flex-col items-center transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileCode className="h-10 w-10 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Wiki Documentation</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Detailed guides and reference materials for using and extending Scoop.
                </p>
              </a>
            </div>
            
            <Button size="lg" asChild>
              <Link href="/apps">
                Start Exploring Packages <SearchIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}