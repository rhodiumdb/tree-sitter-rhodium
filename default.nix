let rev = "65d6153aec85c8cb46023f0a7248628f423ca4ee";
    url = "https://github.com/NixOS/nixpkgs/archive/${rev}.tar.gz";
    sha256 = "1cjd7253c4i0wl30vs6lisgvs947775684d79l03awafx7h12kh8";
    nixpkgs = fetchTarball { inherit url sha256; };
    pkgs = import nixpkgs { config = {}; overlays = []; };
    mkGrammarPath =
      "${nixpkgs}/pkgs/development/tools/parsing/tree-sitter/grammar.nix";
    mkGrammar = pkgs.callPackage mkGrammarPath {};
in {
  tree-sitter = pkgs.tree-sitter;
  treeSitterRhodiumCheck = pkgs.stdenv.mkDerivation {
    name = "tree-sitter-rhodium-check";
    src = pkgs.lib.cleanSource ./.;
    nativeBuildInputs = [ pkgs.coreutils pkgs.tree-sitter pkgs.nodejs ];
    phases = "unpackPhase installPhase";
    installPhase = ''
      mkdir temporary

      BEFORE="$(find . -type f | xargs sha256sum | sort | sha256sum)"
      echo "Checksum before: $BEFORE"
      HOME=$(pwd)/temporary tree-sitter generate
      AFTER="$(find . -type f | xargs sha256sum | sort | sha256sum)"
      echo "Checksum after: $AFTER"
      if [ "$BEFORE" != "$AFTER" ]; then
          echo "Repo changed upon running tree-sitter generate; please add a "
          echo "commit to your PR that consists of the changes resulting from "
          echo "running tree-sitter generate."
          exit 1
      fi
      echo "Successfully determined that tree-sitter generate is up to date"

      HOME=$(pwd)/temporary tree-sitter test || {
          echo "tree-sitter test failed, exiting"
          exit 1
      }

      touch "$out"
    '';
  };
  treeSitterRhodiumGrammar = mkGrammar {
    language = "tree-sitter-rhodium";
    version = pkgs.tree-sitter.version;
    source = pkgs.lib.cleanSource ./.;
  };
}
