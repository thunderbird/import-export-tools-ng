import deprecate from "eslint-plugin-deprecate";
import mozilla from "eslint-plugin-mozilla";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("eslint:recommended", "plugin:mozilla/recommended"), {
    plugins: {
        deprecate,
        mozilla,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...mozilla.environments.jsm.globals,
            ...globals.commonjs,
            EXPORTED_SYMBOLS: "readonly",
            ChromeUtils: "readonly",
            XPCOMUtils: "readonly",
            sizeToContent: "readonly",
            Cc: "readonly",
            Cu: "readonly",
            Ci: "readonly",
            Cr: "readonly",
            browser: "readonly",
            messenger: "readonly",
            ExtensionCommon: "readonly",
            MailServices: "readonly",
            gTabmail: "readonly",
            OS: "readonly",
            window: "readonly",
            msgWindow: "readonly",
            gFolderDisplay: "readonly",
            IOUtils: "readonly",
            PathUtils: "readonly",
            globalThis: "readonly",
            Services: "readonly",
            BatchMessageMover: "readonly",
        },

        ecmaVersion: 5,
        sourceType: "module",
    },

    rules: {
        "no-irregular-whitespace": "error",
        "space-in-parens": "error",
        "no-unused-vars": "off",
        "space-before-function-paren": "off",
        "no-array-constructor": "warn",
        "no-octal": "off",
        "mozilla/import-globals": "off",
        "no-tabs": "off",
        "no-useless-return": "off",
        "object-shorthand": "off",
        "padded-blocks": "off",
        "mozilla/use-cc-etc": "error",
        "mozilla/no-useless-parameters": "off",
        "mozilla/use-services": "off",
        "mozilla/use-includes-instead-of-indexOf": "warn",
        "mozilla/avoid-removeChild": "warn",
        "mozilla/use-chromeutils-generateqi": "off",
        quotes: "off",
        semi: "error",

        complexity: ["error", {
            max: 80,
        }],

        "no-restricted-properties": [1, {
            property: "nsIStringBundleService",
        }],

        "deprecate/function": ["error", {
            name: "createBundle",
            use: "Replace with Services.createBundle",
        }],
    },
}, {
    files: ["./src/chrome/content/*.js"],
}];