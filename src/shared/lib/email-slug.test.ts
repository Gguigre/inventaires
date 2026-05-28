import { describe, it, expect } from "vitest";
import { toEmailSlug, fromAddress } from "./email-slug";

describe("toEmailSlug", () => {
  it("met en minuscules", () => {
    expect(toEmailSlug("CROIX BLANCHE")).toBe("croix-blanche");
  });

  it("retire les accents", () => {
    expect(toEmailSlug("Société de Secourisme")).toBe("societe-de-secourisme");
  });

  it("remplace les espaces et caractères spéciaux par des tirets", () => {
    expect(toEmailSlug("A & B (test)")).toBe("a-b-test");
  });

  it("ne laisse pas de tirets en début ou fin", () => {
    expect(toEmailSlug(" test ")).toBe("test");
  });

  it("fusionne les tirets consécutifs", () => {
    expect(toEmailSlug("a  --  b")).toBe("a-b");
  });

  it('retourne "association" si le résultat est vide', () => {
    expect(toEmailSlug("---")).toBe("association");
    expect(toEmailSlug("")).toBe("association");
  });
});

describe("fromAddress", () => {
  it("formate le champ from avec display name et adresse email", () => {
    expect(fromAddress("Croix Blanche")).toBe(
      "Croix Blanche <croix-blanche@inventaires.gremillet-moghaddam.fr>",
    );
  });
});
