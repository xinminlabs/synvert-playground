import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import CodeEditor from "../shared/CodeEditor";
import Button from "../shared/Button";
import SnippetSelect from "./SnippetSelect";
import { requestUrl } from "../utils";
import ExtensionSelect from "../shared/ExtensionSelect";
import useAppContext from "../shared/useAppContext";
import { Snippet } from "../types";

function ParseSnippet() {
  const { language } = useParams() as { language: string };
  const {
    setAlert,
    extension,
    sourceCode,
    setSourceCode,
    snippetCode,
    setSnippetCode,
    output,
    setOutput,
  } = useAppContext();
  const [parseSynvertSnippetDisabled, setParseSynvertSnippetDisabled] =
    useState<boolean>(false);

  const handleSnippetChanged = useCallback(
    (snippet: Snippet) => setSnippetCode(snippet.source_code),
    [setSnippetCode]
  );

  const parseSynvertSnippet = useCallback(async () => {
    if (sourceCode.length > 0 && snippetCode.length > 0) {
      setParseSynvertSnippetDisabled(true);
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extension,
          code: sourceCode,
          snippet: snippetCode,
        }),
      };
      try {
        const url = requestUrl(language, "parse-synvert-snippet");
        const response = await fetch(url, requestOptions);
        const data = await response.json();
        if (data.error) {
          setAlert(data.error);
          setOutput("");
        } else {
          setAlert("");
          setOutput(data.output);
        }
      } finally {
        setParseSynvertSnippetDisabled(false);
      }
    }
  }, [language, extension, sourceCode, snippetCode]);

  return (
    <>
      <div className="flex justify-between px-4">
        <SnippetSelect handleSnippetChanged={handleSnippetChanged} />
        <ExtensionSelect />
      </div>
      <div className="px-4">
        <div className="font-bold">Input Source Code:</div>
        <CodeEditor
          language={language}
          code={sourceCode}
          setCode={setSourceCode}
          height="200px"
        />
      </div>
      <div className="px-4">
        <div className="font-bold">Synvert Snippet:</div>
        <CodeEditor
          language={language}
          code={snippetCode}
          setCode={setSnippetCode}
          height="400px"
        />
      </div>
      <div className="flex justify-center py-4">
        <Button
          text="Parse Snippet"
          onClick={parseSynvertSnippet}
          disabled={parseSynvertSnippetDisabled}
        />
      </div>
      <div className="px-4">
        <div className="font-bold">Output Source Code:</div>
        <CodeEditor language={language} code={output} readOnly height="200px" />
      </div>
    </>
  );
}

export default ParseSnippet;
