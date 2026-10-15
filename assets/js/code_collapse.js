document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("pre").forEach(function (pre) {

        // Count actual lines of code
        const lines = pre.textContent.split("\n");

        // Leave small snippets alone
        if (lines.length <= 5) {
            return;
        }

        const button = document.createElement("button");

        button.className = "code-expand";
        button.type = "button";
        button.textContent = "⌄";
        button.setAttribute("aria-label", "Expand code");

        button.addEventListener("click", function () {
            const expanded = pre.classList.toggle("code-expanded");

            button.textContent = expanded ? "⌃" : "⌄";
            button.setAttribute(
                "aria-label",
                expanded ? "Collapse code" : "Expand code"
            );
        });

        pre.appendChild(button);
    });
});