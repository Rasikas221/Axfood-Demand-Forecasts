// @ts-check
import { test, expect } from "@playwright/test";
import SPcredentials from "../credentials/SPcredentials";
import axfoodCredentials from "../credentials/axfoodCredentials";
import { Console } from "console";
const XLSX = require("xlsx");


test("Create xlsx", async ({ }) => {
    console.log("date and time");
    try {
        // Get the current date and time as a string
        const options = { timeZone: 'Asia/Kolkata', hour12: true };
        const currentDateTime = new Date().toLocaleString('en-IN', options);
        // Create a new Excel workbook
        const wb = XLSX.utils.book_new();
        // Create an empty worksheet
        const ws = XLSX.utils.aoa_to_sheet([]);
        // Add the current date and time to cell A1 of the worksheet
        XLSX.utils.sheet_add_aoa(ws, [[currentDateTime]], { origin: "A1" });
        // Append the worksheet to the workbook and name it "Sheet1"
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        // Save the workbook as an Excel file in the "download" folder
        XLSX.writeFile(wb, "download/CurrentDateTime.xlsx");
    } catch (error) {
        console.log("Error: ", error);
    }
});

test("Download and Upload Report", async ({ page }) => {
    console.log("download and upload");

    // Navigate to the Axfood supplier portal
    await page.goto("https://leverantor.axfood.se/");
    await expect(page).toHaveTitle(/Axfood IT AB/);

    // Fill in the login credentials
    await page
        .getByRole("textbox", { name: "User name:" })
        .fill(axfoodCredentials.username);
    await page
        .getByRole("textbox", { name: "Password:" })
        .fill(axfoodCredentials.password);

    // Click the Log On button
    await page.getByRole("link", { name: "Log On" }).click();

    // Change language to Swedish
    const isEnglish = await expect(
        page.getByRole("button", { name: "News page" })
    ).toBeVisible();

    // @ts-ignore
    //Check website lan
    if (!isEnglish) {
        await page.getByRole("button", { name: "" }).click();
        await page.getByRole("button", { name: "English" }).click();
    } else {
        await page.getByRole("button", { name: "" }).click();
        await page.getByRole("button", { name: "Engelska" }).click();
    }

    // Click to company logo
    await page.getByRole("button", { name: "Company Logo" }).click();
    await expect(page).toHaveTitle(/Home/);

    // click to "Demand forecast DC Tile"
    await page.getByRole("link", { name: "Demand forecast DC Tile" }).click();
    await expect(page).toHaveTitle(/Demand forecast DC/);

    // Click search button
    await page.getByRole("button", { name: "Search", exact: true }).click();

    // Download the xlsx file
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportera till excel" }).click();
    const download = await downloadPromise;
    await download.saveAs("download/achaulienReport.xlsx");

    // Navigate to SharePoint site
    await page.goto(
        "https://achaulien.sharepoint.com/sites/IntranetDev/Delade%20dokument/Forms/AllItems.aspx"
    );

    // Login to SharePoint
    await page
        .getByPlaceholder("Email, phone, or Skype")
        .fill(SPcredentials.username);
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByPlaceholder("Password").fill(SPcredentials.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("button", { name: "Yes" }).click();

    // Upload the file to SharePoint
    await page.getByRole("link", { name: "WeeklyReportScript" }).click();
    await page.waitForTimeout(10000);
    await expect(
        page.getByText("WeeklyReportScriptWeeklyReportScript")
    ).toBeVisible();

    //click to upload button
    await page.getByRole("menuitem", { name: "Upload" }).click();

    // choose file
    const [fileChooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        page.getByLabel("Files", { exact: true }).click(),
    ]);

    await fileChooser.setFiles([
        "download/achaulienReport.xlsx",
        "download/CurrentDateTime.xlsx",
    ]);

    // click to Replace all button
    await page.getByRole("button", { name: "Replace all" }).click();

    // Verify file upload success
    await expect(page.getByRole("alert")).toBeVisible();

    await page.close();
});
