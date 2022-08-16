import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { requestUrl } from "../utils";
import { Button } from "../shared/Button";
import { ExtensionSelect } from "../shared/ExtensionSelect";
import useFileType from "../shared/useFileType";
import { TextField } from "../shared/TextField";
import { TextAreaField } from "../shared/TextAreaField";

function GenerateSnippet() {
  const { language } = useParams() as { language: string };
  const [extension, setExtension] = useFileType(language);
  const [filePattern, setFilePattern] = useState<string>("");
  const [rubyVersion, setRubyVersion] = useState<string>("");
  const [gemVersion, setGemVersion] = useState<string>("");
  const [nodeVersion, setNodeVersion] = useState<string>("");
  const [npmVersion, setNpmVersion] = useState<string>("");
  const [inputs, setInputs] = useState<string[]>([""]);
  const [outputs, setOutputs] = useState<string[]>([""]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedSnippet, setGeneratedSnippet] = useState<string>("");
  const [snippet, setSnippet] = useState<string>("");

  const setInputSourceCode = (code: string, index: number) => {
    inputs[index] = code;
    setInputs(inputs);
  };

  const setOutputSourceCode = (code: string, index: number) => {
    outputs[index] = code;
    setOutputs(outputs);
  };

  const addMoreInputOutput = () => {
    setInputs([...inputs, ""]);
    setOutputs([...outputs, ""]);
  };

  const generateSnippet = useCallback(async () => {
    setGenerating(true);
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extension, inputs, outputs }),
    };
    try {
      const url = requestUrl(language, "generate-snippet");
      const response = await fetch(url, requestOptions);
      const data = await response.json();
      setGeneratedSnippet(data.snippet);
    } finally {
      setGenerating(false);
    }
  }, [language, extension, inputs, outputs]);

  useEffect(() => {
    setFilePattern(`**/*.${extension}`);
    setRubyVersion("");
    setGemVersion("");
    setNodeVersion("");
    setNpmVersion("");
    setInputs([""]);
    setOutputs([""]);
    setGeneratedSnippet("");
    setSnippet("");
  }, [language, extension]);

  useEffect(() => {
    if (generatedSnippet.length === 0) {
      setSnippet("");
      return;
    }
    if (["typescript", "javascript"].includes(language)) {
      let snippet = `const Synvert = require("synvert-core");\n\n`;
      snippet += `Synvert.Rewriter.execute(() => {\n`;
      snippet += `  configure({ parser: "typescript" });\n`;
      if (nodeVersion) {
        snippet += `  ifNode("${nodeVersion}");\n`;
      }
      if (npmVersion) {
        const index = npmVersion.indexOf(" ");
        const name = npmVersion.substring(0, index);
        const version = npmVersion.substring(index + 1);
        snippet += `  ifNpm("${name}", "${version}");\n`;
      }
      snippet += `  withinFiles('${filePattern}', () => {\n`;
      if (generatedSnippet) {
        snippet += "    ";
        snippet += generatedSnippet.replace(/\n/g, "\n    ");
        snippet += "\n";
      }
      snippet += "  });\n";
      snippet += "});";
      setSnippet(snippet);
    }
    if (language === "ruby") {
      let snippet = "Synvert::Rewriter.execute do\n";
      if (rubyVersion) {
        snippet += `  if_ruby '${rubyVersion}'\n`;
      }
      if (gemVersion) {
        const index = gemVersion.indexOf(" ");
        const name = gemVersion.substring(0, index);
        const version = gemVersion.substring(index + 1);
        snippet += `  if_gem '${name}', '${version}'\n`;
      }
      snippet += `  within_files '${filePattern}' do\n`;
      if (generatedSnippet) {
        snippet += "    ";
        snippet += generatedSnippet.replace(/\n/g, "\n    ");
        snippet += "\n";
      }
      snippet += "  end\n";
      snippet += "end";
      setSnippet(snippet);
    }
  }, [
    language,
    filePattern,
    rubyVersion,
    gemVersion,
    nodeVersion,
    npmVersion,
    generatedSnippet,
  ]);

  return (
    <>
      <ExtensionSelect
        extension={extension}
        handleExtensionChanged={setExtension}
      />
      <div className="px-4 pb-4">
        <div className="font-bold">File Pattern:</div>
        <TextField value={filePattern} handleValueChanged={setFilePattern} />
      </div>
      {language === "ruby" && (
        <div className="flex">
          <div className="w-1/2 px-4 pb-4">
            <div className="font-bold">Minimum Ruby Version:</div>
            <TextField
              value={rubyVersion}
              placeholder="e.g. 3.1.2"
              handleValueChanged={setRubyVersion}
            />
          </div>
          <div className="w-1/2 px-4 pb-4">
            <div className="font-bold">Gem Version:</div>
            <TextField
              value={gemVersion}
              placeholder="e.g.rails ~> 7.0.3"
              handleValueChanged={setGemVersion}
            />
          </div>
        </div>
      )}
      {["javascript", "typescript"].includes(language) && (
        <div className="flex">
          <div className="w-1/2 px-4 pb-4">
            <div className="font-bold">Minimum Node Version:</div>
            <TextField
              value={nodeVersion}
              placeholder="e.g. 18.7.0"
              handleValueChanged={setNodeVersion}
            />
          </div>
          <div className="w-1/2 px-4 pb-4">
            <div className="font-bold">Npm Version:</div>
            <TextField
              value={npmVersion}
              placeholder="e.g.express ^4.18.1"
              handleValueChanged={setNpmVersion}
            />
          </div>
        </div>
      )}
      <div className="flex">
        <div className="w-1/2 px-4">
          <div className="font-bold">Inputs</div>
          {inputs.map((input, index) => (
            <div className="mb-2" key={index}>
              <TextAreaField
                code={input}
                setCode={(code: string) => {
                  setInputSourceCode(code, index);
                }}
                rows={10}
              />
            </div>
          ))}
        </div>
        <div className="w-1/2 px-4">
          <div className="font-bold">Outputs</div>
          {outputs.map((output, index) => (
            <div className="mb-2" key={index}>
              <TextAreaField
                code={output}
                setCode={(code: string) => {
                  setOutputSourceCode(code, index);
                }}
                rows={10}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between p-4">
        <button onClick={addMoreInputOutput}>Add More Input/Output</button>
        <Button
          text="Generate Snippet"
          onClick={generateSnippet}
          disabled={generating}
        />
      </div>
      <div className="px-4">
        <TextAreaField
          code={snippet}
          readOnly
          rows={20}
        />
      </div>
    </>
  );
}

export default GenerateSnippet;
