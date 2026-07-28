const defaultInput = `As a customer, I want to log in with my email and password so that I can access my account.
The system should show an error message when the password is incorrect.
As an admin, I want to add a new user so that the team can access the portal.`;

const form = document.getElementById("generator-form");
const requirementsInput = document.getElementById("requirements");
const templateSelect = document.getElementById("template-select");
const resultContainer = document.getElementById("result");
const loadSampleButton = document.getElementById("load-sample");
const clearButton = document.getElementById("clear-input");
const copyButton = document.getElementById("copy-output");
const exportCsvButton = document.getElementById("export-csv");
const exportExcelButton = document.getElementById("export-excel");
let currentTestCases = [];

const templateLibrary = {
  functional: {
    name: "Functional",
    description: "Standard user flow validation",
    steps: [
      "Open the relevant feature or screen.",
      "Enter the data referenced in the requirement.",
      "Perform the requested action.",
      "Verify the system behaves as expected and shows the correct outcome.",
    ],
  },
  smoke: {
    name: "Smoke",
    description: "High-value happy path verification",
    steps: [
      "Open the relevant feature.",
      "Complete the primary action with valid data.",
      "Confirm the feature works and the user receives the expected success response.",
    ],
  },
  regression: {
    name: "Regression",
    description: "Regression-focused validation",
    steps: [
      "Reproduce the requirement in the current build.",
      "Validate the main workflow and any related behavior.",
      "Confirm the change did not break nearby functionality.",
    ],
  },
  negative: {
    name: "Negative",
    description: "Error-handling and invalid input validation",
    steps: [
      "Open the feature with invalid or boundary data.",
      "Submit the action and capture the system response.",
      "Verify the correct error message, validation, or fallback behavior appears.",
    ],
  },
  ui: {
    name: "UI",
    description: "User interface and usability validation",
    steps: [
      "Open the relevant screen or component.",
      "Check the visible elements, labels, and navigation.",
      "Verify the interface behaves correctly and matches the intended design.",
    ],
  },
};

function initialize() {
  requirementsInput.value = defaultInput;
  generateTestCases(defaultInput, templateSelect.value);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  generateTestCases(requirementsInput.value, templateSelect.value);
});

loadSampleButton.addEventListener("click", () => {
  requirementsInput.value = defaultInput;
  generateTestCases(defaultInput, templateSelect.value);
});

clearButton.addEventListener("click", () => {
  requirementsInput.value = "";
  currentTestCases = [];
  updateExportState();
  resultContainer.innerHTML = '<p class="result-placeholder">No test cases yet. Add requirements to begin.</p>';
});

copyButton.addEventListener("click", async () => {
  const summary = resultContainer.innerText;
  try {
    await navigator.clipboard.writeText(summary);
    copyButton.textContent = "Copied";
    setTimeout(() => {
      copyButton.textContent = "Copy summary";
    }, 1800);
  } catch (error) {
    copyButton.textContent = "Copy failed";
  }
});

function generateTestCases(inputText, templateType) {
  const requirements = inputText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!requirements.length) {
    currentTestCases = [];
    updateExportState();
    resultContainer.innerHTML = '<p class="result-placeholder">No test cases yet. Add requirements to begin.</p>';
    return;
  }

  const testCases = requirements.map((requirement, index) => buildTestCase(requirement, index + 1, templateType));
  currentTestCases = testCases;
  updateExportState();
  renderTestCases(testCases);
}

function buildTestCase(requirement, index, templateType) {
  const normalizedRequirement = requirement.replace(/^[-*•]\s*/, "");
  const template = templateLibrary[templateType] || templateLibrary.functional;
  const title = buildTitle(normalizedRequirement, template);
  const steps = buildSteps(normalizedRequirement, template);
  const expectedResult = buildExpectedResult(normalizedRequirement, template);
  const priority = inferPriority(normalizedRequirement);

  return {
    id: `TC-${String(index).padStart(2, "0")}`,
    title,
    requirement: normalizedRequirement,
    preconditions: "The system is available and the relevant user role is active.",
    steps,
    expectedResult,
    priority,
    template: template.name,
    templateDescription: template.description,
  };
}

function buildTitle(requirement, template) {
  const words = requirement.split(/\s+/).filter(Boolean);
  const shortTitle = words.slice(0, Math.min(8, words.length)).join(" ").replace(/[.?!]+$/, "");
  return `${template.name} ${shortTitle}`;
}

function buildSteps(requirement, template) {
  const lower = requirement.toLowerCase();

  if (template.name === "Smoke") {
    return templateLibrary.smoke.steps;
  }

  if (template.name === "Regression") {
    return templateLibrary.regression.steps;
  }

  if (template.name === "Negative") {
    return templateLibrary.negative.steps;
  }

  if (template.name === "UI") {
    return templateLibrary.ui.steps;
  }

  if (lower.includes("login") || lower.includes("sign in")) {
    return [
      "Open the sign-in screen.",
      "Enter a valid username and password.",
      "Submit the form.",
      "Verify the user is authenticated and directed to the correct page.",
    ];
  }

  if (lower.includes("password") || lower.includes("reset")) {
    return [
      "Open the password recovery or reset flow.",
      "Enter the required account information.",
      "Submit the recovery request.",
      "Verify the expected confirmation or reset result appears.",
    ];
  }

  if (lower.includes("add") || lower.includes("create") || lower.includes("register")) {
    return [
      "Open the relevant creation or registration form.",
      "Enter the required data for the new item or user.",
      "Submit the form.",
      "Verify the item or user is created and displayed correctly.",
    ];
  }

  return templateLibrary.functional.steps;
}

function buildExpectedResult(requirement, template) {
  const match = requirement.match(/\b(should|must|can)\b/i);
  if (match) {
    const keyword = match[1].toLowerCase();
    const clause = requirement.slice(match.index + match[0].length).trim().replace(/[.?!]+$/, "");
    return `The system ${keyword} ${clause}.`;
  }

  if (template.name === "Negative") {
    return "The system shows a clear validation message or handles the invalid data without crashing.";
  }

  if (template.name === "UI") {
    return "The interface displays the expected controls and behaves consistently for the user.";
  }

  return "The system completes the requested action successfully and presents the expected outcome.";
}

function inferPriority(requirement) {
  const match = requirement.match(/\b(should|must|can)\b/i);
  if (match) {
    const keyword = match[1].toLowerCase();
    const clause = requirement.slice(match.index + match[0].length).trim().replace(/[.?!]+$/, "");
    return `The system ${keyword} ${clause}.`;
  }

  return "The system completes the requested action successfully and presents the expected outcome.";
}

function inferPriority(requirement) {
  const lower = requirement.toLowerCase();
  if (lower.includes("error") || lower.includes("security") || lower.includes("payment") || lower.includes("critical")) {
    return "High";
  }
  if (lower.includes("login") || lower.includes("reset") || lower.includes("delete")) {
    return "High";
  }
  return "Medium";
}

function renderTestCases(testCases) {
  const heading = `<p><strong>${testCases.length}</strong> test case${testCases.length === 1 ? "" : "s"} generated.</p>`;

  const cards = testCases
    .map(
      (testCase) => `
        <article class="case-card">
          <div class="case-meta">
            <span class="badge">${testCase.id}</span>
            <span class="badge">Priority: ${testCase.priority}</span>
            <span class="badge">${testCase.template}</span>
          </div>
          <h3>${testCase.title}</h3>
          <p><strong>Requirement:</strong> ${testCase.requirement}</p>
          <p><strong>Template:</strong> ${testCase.templateDescription}</p>
          <p><strong>Preconditions:</strong> ${testCase.preconditions}</p>
          <p><strong>Steps:</strong></p>
          <ul>
            ${testCase.steps.map((step) => `<li>${step}</li>`).join("")}
          </ul>
          <p><strong>Expected result:</strong> ${testCase.expectedResult}</p>
        </article>
      `
    )
    .join("");

  resultContainer.innerHTML = `${heading}<div class="case-list">${cards}</div>`;
}

function updateExportState() {
  const hasCases = currentTestCases.length > 0;
  exportCsvButton.disabled = !hasCases;
  exportExcelButton.disabled = !hasCases;
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function exportCsv() {
  if (!currentTestCases.length) {
    return;
  }

  const header = ["ID", "Title", "Template", "Priority", "Requirement", "Preconditions", "Steps", "Expected Result"];
  const rows = currentTestCases.map((testCase) => [
    testCase.id,
    testCase.title,
    testCase.template,
    testCase.priority,
    testCase.requirement,
    testCase.preconditions,
    testCase.steps.join(" | "),
    testCase.expectedResult,
  ]);

  const csvContent = [header, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  downloadFile("manual-test-cases.csv", csvContent, "text/csv;charset=utf-8;");
}

function exportExcel() {
  if (!currentTestCases.length) {
    return;
  }

  const rows = currentTestCases.map((testCase) => `
    <Row>
      <Cell><Data ss:Type="String">${escapeXml(testCase.id)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(testCase.title)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(testCase.template)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(testCase.priority)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(testCase.requirement)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(testCase.preconditions)}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(testCase.steps.join(" | "))}</Data></Cell>
      <Cell><Data ss:Type="String">${escapeXml(testCase.expectedResult)}</Data></Cell>
    </Row>
  `);

  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:html="http://www.w3.org/TR/REC-html40">
    <Worksheet ss:Name="Test Cases">
      <Table>
        <Row>
          <Cell><Data ss:Type="String">ID</Data></Cell>
          <Cell><Data ss:Type="String">Title</Data></Cell>
          <Cell><Data ss:Type="String">Template</Data></Cell>
          <Cell><Data ss:Type="String">Priority</Data></Cell>
          <Cell><Data ss:Type="String">Requirement</Data></Cell>
          <Cell><Data ss:Type="String">Preconditions</Data></Cell>
          <Cell><Data ss:Type="String">Steps</Data></Cell>
          <Cell><Data ss:Type="String">Expected Result</Data></Cell>
        </Row>
        ${rows.join("")}
      </Table>
    </Worksheet>
  </Workbook>`;

  downloadFile("manual-test-cases.xls", workbook, "application/vnd.ms-excel;charset=utf-8;");
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function downloadFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

exportCsvButton.addEventListener("click", exportCsv);
exportExcelButton.addEventListener("click", exportExcel);

initialize();
