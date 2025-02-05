const uploadButton = document.getElementById('upload-button');
const fileInput = document.getElementById('file-input');
const saveButton = document.getElementById('save-button');
const undoButton = document.getElementById('undo-button');
const itemidEntry = document.getElementById("itemid-entry");
const upcEntry = document.getElementById("upc-entry");
const unitEntry = document.getElementById("unit-entry");
const damagedEntry = document.getElementById("damaged-entry");
const expdateEntry = document.getElementById("expdate-entry");
const infoText = document.getElementById("info-text");
const downloadButton = document.getElementById("download-button");
const summaryButton = document.getElementById("summary-button");
const backButton = document.getElementById("summuary-back-button");
const scannerBackButton = document.getElementById("scanner-back-button");
const leftPanel = document.getElementById("left-panel");
const rightPanel = document.getElementById("right-panel");
const summaryTable = document.getElementById("summaryTableContainer");
const maxButton = document.getElementById("max-button");
const container = document.getElementById("results-table-container");
const datePickButton = document.getElementById("date-button");
const themes = ["theme1.css", "theme2.css", "theme3.css"];
const themeLink = document.getElementById("theme-link");
const toggleButton = document.getElementById("theme-toggle");
const readerContainer = document.getElementById("reader-container");
const scanButton = document.getElementById("scan-button");
const mainContainer = document.getElementById("main-container");



let currentTheme = localStorage.getItem("theme") || themes[0];
themeLink.setAttribute("href", currentTheme);


window.form_data = {};
window.bool_misspick = false;
window.ExcelName = "data.xlsx";

backButton.style.display = "none";
leftPanel.style.display = "flex";
rightPanel.style.display = "flex";
summaryTable.style.display = "none";
container.style.display = "none";
readerContainer.style.display = "none";


maxButton.disabled = true;
summaryButton.disabled = true;
saveButton.disabled = true;
undoButton.disabled = true;
upcEntry.disabled = true;
itemidEntry.disabled = true;
unitEntry.disabled = true;
damagedEntry.disabled = true;
expdateEntry.disabled = true;
downloadButton.disabled = true;
datePickButton.disabled = true;
scanButton.disabled = true;

upcEntry.value = "";
itemidEntry.value = "";
unitEntry.value = "";
damagedEntry.value = "";
expdateEntry.value = "";
downloadButton.value = "";






toggleButton.addEventListener("click", () => {
    let currentIndex = themes.indexOf(themeLink.getAttribute("href"));
    let nextIndex = (currentIndex + 1) % themes.length; // Sonraki temaya geç
    let newTheme = themes[nextIndex];

    // Yeni CSS dosyasını yükle
    themeLink.setAttribute("href", newTheme);

    // Kullanıcının seçimini kaydet
    localStorage.setItem("theme", newTheme);
});
document.getElementById("download-template-button").addEventListener("click", function () {
    // 📌 1️⃣ Yeni bir çalışma kitabı (Workbook) oluştur
    let wb = XLSX.utils.book_new();
    
    // 📌 2️⃣ Sayfa içeriğini belirle
    let wsData = [
        ["PO No.", "Item ID", "Case Pack", "Brand", "Description", "Upc", "ShipQuantity", "fba", "fbm", "Received", "Status", "Unit", "Damaged", "Expiring Soon", "exp date"], // Başlıklar
        ["18-33324996", "84723", 1, "Vigo", "Rice Dnnr Yllw", "071072013014", 1200, 1120, 80, "", "", "", "", "", ""],      // Örnek veri
    ];

    // 📌 3️⃣ Veriyi Excel sayfasına çevir
    let ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 📌 4️⃣ Sayfayı çalışma kitabına ekle
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    
    // 📌 5️⃣ Excel dosyasını oluştur ve indir
    XLSX.writeFile(wb, "template.xlsx");
});

flatpickr(datePickButton, {
    dateFormat: "m-d-Y",
    allowInput: false,
    disableMobile: true,
    onChange: function(selectedDates, dateStr, instance) {
        expdateEntry.value = dateStr;
    }
});

maxButton.addEventListener("click", function() {
    try{
        unitEntry.value = window.excelData[window.itemIndex]["ShipQuantity"] - window.excelData[window.itemIndex]["Received"];
    }
    catch{
        console.error("Error writing max value: ", error);
    }
    damagedEntry.focus();
});
// Dosya yükleme butonuna tıklanırsa, dosya inputunu tetikle
uploadButton.addEventListener('click', function() {
    fileInput.click(); // Dosya inputunu tetikle
});

backButton.addEventListener("click", function() {
    leftPanel.style.display = "flex";
    rightPanel.style.display = "flex";
    backButton.style.display = "none";
    summaryTable.style.display = "none";
});

// Dosya yüklenip yüklenmediğini kontrol et
fileInput.addEventListener('change', function(event) {
    // Eğer bir dosya yüklenmişse
    if (fileInput.files.length > 0) {
        // Butonları aktif yap
        itemidEntry.disabled = false;
        upcEntry.disabled = false;
        scanButton.disabled = false;
        summaryButton.disabled = false;
        window.addEventListener("beforeunload", function (event) {
            const message = "Your datas have not saved yet. Do you really want to leave?";
            event.returnValue = message;  // Eski tarayıcılar için
            return message; // Yeni tarayıcılar için
        });
    } else {
        // Eğer dosya yoksa, butonları pasif yap
        itemidEntry.disabled = true;
        upcEntry.disabled = true;
        scanButton.disabled = true;
    }
    const file = event.target.files[0];
    window.ExcelName = file.name;
    if (!file) {
        infoText.innerText = "No file selected";
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Assuming the first sheet contains data
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON
        let jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" }); // defval: "" fills empty cells with ""

        console.log("Parsed Excel Data:", jsonData);

        // Modify data (Equivalent to Pandas transformations)
        jsonData = jsonData.map(row => {
            row["Upc"] = processUpc(row["Upc"]); // Equivalent to self.x() function in Python
            row["Item Id"] = processItemId(row["Item Id"]); // Equivalent to item_id_int_convert
            row["exp date"] = row["exp date"] || ""; // Fill NaN values with empty string
            row["Status"] = row["Status"] || "";

            // Apply "MISSING" status where "Received" is empty
            if (!row["Received"] && !row["Status"]) {
                row["ShipQuantity"] = row["ShipQuantity"];
                row["Status"] = "MISSING";
                row["Received"] = 0;
            }

            return row;
        });

        console.log("Processed Data:", jsonData);

        // Update UI
        infoText.innerText = `Excel File: ${file.name}`;
        //document.getElementById("summary-button").disabled = false; // Enable the summary button

        // Store data globally for further processing
        window.excelData = jsonData;
    };

    reader.readAsArrayBuffer(file);
});
undoButton.addEventListener("click", function(event) {
    if (window.backup_df) {
        window.excelData = JSON.parse(JSON.stringify(window.backup_df));  // Yedek veriyi geri yükle
    }
    undoButton.disabled = true;
    saveButton.disabled = false;

    upcEntry.disabled = false;
    scanButton.disabled = false;
    itemidEntry.disabled = false;
    unitEntry.disabled = false;
    damagedEntry.disabled = false;
    expdateEntry.disabled = false;
    datePickButton.disabled = false;

    upcEntry.value = window.form_data["upc"];
    itemidEntry.value = window.form_data["itemid"];
    unitEntry.value = window.form_data["unit"];
    damagedEntry.value = window.form_data["damaged"];
    expdateEntry.value = window.form_data["expdate"];

    itemid_scan()
    
});

summaryButton.addEventListener("click", function() {
    // "MISSING" olan öğeleri filtrele
    const missingItems = window.excelData.filter(row => row.Status === "MISSING");

    // Eğer "MISSING" öğesi yoksa kullanıcıya bilgi ver
    if (missingItems.length === 0) {
        document.getElementById("summaryTableContainer").innerHTML = "No MISSING items found.";
        return;
    }

    // Tabloyu oluştur
    let tableHtml = "<table border='1'><thead><tr>";

    // DataFrame'deki ilk öğeyi (row) alarak sütun isimlerini dinamik olarak ekle
    const columns = Object.keys(missingItems[0]);
    columns.forEach(col => {
        if (col == "Unit"){
            tableHtml += `<th class="table-unit-col">${col}</th>`;
        }
        else if (col == "Received"){
            tableHtml += `<th class="table-received-col">${col}</th>`;
        }
        else{
            tableHtml += `<th>${col}</th>`;
        }
        
    });

    tableHtml += "</tr></thead><tbody>";

    // Her bir "MISSING" öğesini tabloya ekle
    missingItems.forEach(item => {
        tableHtml += "<tr>";
        columns.forEach(col => {
            if (col == "Unit"){
                tableHtml += `<th class="table-unit-col">${item[col]}</th>`;
            }
            else if (col == "Received"){
                tableHtml += `<th class="table-received-col">${item[col]}</th>`;
            }
            else{
                tableHtml += `<th>${item[col]}</th>`;
            }
        });
        tableHtml += "</tr>";
    });

    tableHtml += "</tbody></table>";

    // Tabloyu ekrana yazdır
    summaryTable.innerHTML = tableHtml;
    summaryTable.style.display = "flex";
    backButton.style.display = "block";
    leftPanel.style.display = "none";
    rightPanel.style.display = "none";
});
scannerBackButton.addEventListener("click", function() {
    window.html5Qrcodeglobal.stop();
    scannerBackButton.style.display = "none";
    mainContainer.style.display = "flex";
    readerContainer.style.display = "none";
});
scanButton.addEventListener("click", function() {
    QRScanner()
})
function QRScanner() {
    const html5Qrcode = new Html5Qrcode('reader');
    mainContainer.style.display = "none";
    readerContainer.style.display = "flex";
    scannerBackButton.style.display = "flex";
    window.html5Qrcodeglobal = html5Qrcode;
    const qrCodeSuccessCallback = (decodedText, decodedResult)=>{
        if(decodedText){
            upcEntry.value = decodedText;
            upc_scan();
            html5Qrcode.stop();
            mainContainer.style.display = "flex";
            readerContainer.style.display = "none";
            scannerBackButton.style.display = "none";
        }
    }
    const config = {fps:10, qrbox:{width:250, height:250}}
    html5Qrcode.start({facingMode:"environment"}, config,qrCodeSuccessCallback );
}


function processUpc(upc) {
    return upc ? upc.toString().padStart(12, "0") : "";
}

// Function to convert Item ID (Replace with real logic)
function processItemId(id) {
    return parseInt(id) || 0;
}

itemidEntry.addEventListener("keydown", function(event) {
    if (event.key === "Enter") { 
        event.preventDefault(); // Varsayılan Enter davranışını (form gönderme vs.) engelle
        //itemid_scan();
        const id = itemidEntry.value.trim(); // Kullanıcının girdiği ID
        if (!id) {
            alert("Please enter an Item ID.");
            return;
        }

        if (!window.excelData) {
            alert("Please upload an Excel file first.");
            return;
        }
        searchfromlasts(id);
    }
});

function displayResults(rows, itemid=false) {
    infoText.style.display = "none";
    container.style.display = "flex";
    
    
    if (rows.length === 0) {
        container.innerHTML = "Sonuç bulunamadı.";
        return;
        }
    else if (rows.length > 1) {
        let tableHtml = "<table border='1'><thead><tr>";
        if (itemid) {
            // Tablo başlıklarını dataframe sütun adlarından al
            const columns = Object.keys(rows[0]);
            tableHtml += `<th>${"Brand"}</th>
                        <th>${"Description"}</th>
                        <th>${"Upc"}</th>
                        <th>${"Item Id"}</th>`;


            tableHtml += "</tr></thead><tbody>";

            // Satırları ekle
            rows.forEach((row, index) => {
                tableHtml += `<tr class="rows" onclick="selectRow(${row.realIndex})">`;
                tableHtml += `<td>${row["Brand"]}</td>
                            <td>${row["Description"]}</td>
                            <td>${row["Upc"]}</td>
                            <td>${row["Item Id"]}</td>`;
                tableHtml += "</tr>";
            });

            tableHtml += "</tbody></table>";
            container.innerHTML = tableHtml;
        }
        else {
            // Tablo başlıklarını dataframe sütun adlarından al
            const columns = Object.keys(rows[0]);
            tableHtml += `<th>${"Brand"}</th>
                        <th>${"Description"}</th>
                        <th>${"Upc"}</th>`;


            tableHtml += "</tr></thead><tbody>";

            // Satırları ekle
            rows.forEach((row, index) => {
                tableHtml += `<tr class="rows" onclick="selectRow(${row.realIndex})">`;
                tableHtml += `<td>${row["Brand"]}</td>
                            <td>${row["Description"]}</td>
                            <td>${row["Upc"]}</td>`;
                tableHtml += "</tr>";
            });

            tableHtml += "</tbody></table>";
            container.innerHTML = tableHtml;
        }
        
    }
    else if (rows.length === 1) {
        let index = rows[0].realIndex;
        console.log(index);
        selectRow(index);
    }
}
    

function selectRow(index) {
    index_scan(index);
}

function searchfromlasts(searchId) {
    
    const matchingRows = [];
    window.excelData.forEach((row, realIndex) => {
        let itemId = row["Item Id"]; // Değeri al
        if (itemId && itemId.toString().toLowerCase().slice(-searchId.length).includes(searchId.toLowerCase())) {
            matchingRows.push({ realIndex, ...row }); // Gerçek index'i de saklıyoruz
        }
    });
    

    // Sonuçları göster
    displayResults(matchingRows, true);
    
} 


function itemid_scan() {
    const searchId = itemidEntry.value.trim(); // Kullanıcının girdiği ID
    if (!searchId) {
        alert("Please enter an Item ID.");
        return;
    }

    if (!window.excelData) {
        alert("Please upload an Excel file first.");
        return;
    }


    // JSON verisinde Item ID'yi bul
    const foundItem = window.excelData.find(row => row["Item Id"] == searchId);
    const itemIndex = window.excelData.findIndex(row => row["Item Id"] == searchId);

    // Eğer bulunduysa ekrana yazdır
    if (foundItem) {
        let casepack = foundItem["Case Pack"];
        let shipquantity = foundItem["ShipQuantity"];
        let received = foundItem["Received"];
        let info = "";
        for (let column in foundItem) {
            // Sütun adı ve değeri birleştirip info'ya ekliyoruz
            if (!(column.includes("exp date")) && column != "Status" && column != "Expiring Soon" && column != "Unit")
                {
                    info += `${column}: ${foundItem[column]}\n`;
                }
                
        }

        if (typeof shipquantity === "number" && Number.isInteger(shipquantity)) {
            shipquantity = parseInt(shipquantity, 10);
        }
        if (typeof received === "number" && Number.isInteger(received)) {
            received = parseInt(received, 10);
        }
        if (casepack !== null && casepack !== "" && !isNaN(casepack) && casepack !== 0) {
            try {
                casepack = parseInt(casepack, 10);
        
                if (casepack === 1) {
                    info += `\n${(shipquantity - received)} UNITS`;
                } else {
                    if (typeof shipquantity === "number" && Number.isInteger(shipquantity)) {
                        shipquantity = parseInt(shipquantity, 10);
                    }
                    if (typeof received === "number" && Number.isInteger(received)) {
                        received = parseInt(received, 10);
                    }
        
                    let caseCount = Math.floor((shipquantity - received) / casepack);
                    let unitCount = (shipquantity - received) % casepack;
                    info += `\n${caseCount} CASE, ${unitCount} UNITS`
                }
            } catch (error) {
                console.error("Error processing casepack:", error);
            }
        }
        infoText.innerText = info;
        upcEntry.value = foundItem["Upc"];
        expdateEntry.value = foundItem["exp date"];
        unitEntry.disabled = false;
        damagedEntry.disabled = false;
        expdateEntry.disabled = false;
        datePickButton.disabled = false;
        saveButton.disabled = false;
        maxButton.disabled = false;
        unitEntry.focus();
        window.itemIndex = itemIndex;
        window.bool_misspick = false;
    } else {
        infoText.innerText = "Item ID not found. Item Id will be added to end of the file";
        
        unitEntry.disabled = false;
        damagedEntry.disabled = false;
        expdateEntry.disabled = false;
        datePickButton.disabled = false;
        saveButton.disabled = false;
        const newRow = {};

        // DataFrame'deki her bir sütun adı için boş bir değer ekliyoruz
        const columns = Object.keys(window.excelData[0]); // İlk satırdaki sütun adlarını alıyoruz
        columns.forEach(col => {
            newRow[col] = ""; // Her sütun için değeri boş string olarak ayarlıyoruz
        });

        // Yeni satırı ekliyoruz
        window.excelData.push(newRow);
        window.bool_misspick = true;
        window.itemIndex = window.excelData.length-1;
        unitEntry.focus();
    }
    
}

function index_scan(index) {
    if (!index && index !== 0) {
        alert("Please choose one.");
        return;
    }

    if (!window.excelData) {
        alert("Please upload an Excel file first.");
        return;
    }

    // JSON verisinde Item ID'yi bul
    const foundItem = window.excelData[index]
    const itemIndex = index

    infoText.style.display = "flex";
    container.style.display = "none";

    // Eğer bulunduysa ekrana yazdır
    if (foundItem) {
        let casepack = foundItem["Case Pack"];
        let shipquantity = foundItem["ShipQuantity"];
        let received = foundItem["Received"];
        let info = "";
        for (let column in foundItem) {
            // Sütun adı ve değeri birleştirip info'ya ekliyoruz
            if (!(column.includes("exp date")) && column != "Status" && column != "Expiring Soon" && column != "Unit")
                {
                    info += `${column}: ${foundItem[column]}\n`;
                }
                
        }

        if (typeof shipquantity === "number" && Number.isInteger(shipquantity)) {
            shipquantity = parseInt(shipquantity, 10);
        }
        if (typeof received === "number" && Number.isInteger(received)) {
            received = parseInt(received, 10);
        }
        if (casepack !== null && casepack !== "" && !isNaN(casepack) && casepack !== 0) {
            try {
                casepack = parseInt(casepack, 10);
        
                if (casepack === 1) {
                    info += `\n${(shipquantity - received)} UNITS`;
                } else {
                    if (typeof shipquantity === "number" && Number.isInteger(shipquantity)) {
                        shipquantity = parseInt(shipquantity, 10);
                    }
                    if (typeof received === "number" && Number.isInteger(received)) {
                        received = parseInt(received, 10);
                    }
        
                    let caseCount = Math.floor((shipquantity - received) / casepack);
                    let unitCount = (shipquantity - received) % casepack;
                    info += `\n${caseCount} CASE, ${unitCount} UNITS`
                }
            } catch (error) {
                console.error("Error processing casepack:", error);
            }
        }
        infoText.innerText = info;
        upcEntry.value = foundItem["Upc"];
        itemidEntry.value = foundItem["Item Id"]
        expdateEntry.value = foundItem["exp date"];
        unitEntry.disabled = false;
        damagedEntry.disabled = false;
        expdateEntry.disabled = false;
        datePickButton.disabled = false;
        saveButton.disabled = false;
        maxButton.disabled = false;
        unitEntry.focus();
        window.itemIndex = itemIndex;
        window.bool_misspick = false;
    } else {
        infoText.innerText = "Item ID not found. Item Id will be added to end of the file";
        
        unitEntry.disabled = false;
        damagedEntry.disabled = false;
        expdateEntry.disabled = false;
        datePickButton.disabled = false;
        saveButton.disabled = false;
        const newRow = {};

        // DataFrame'deki her bir sütun adı için boş bir değer ekliyoruz
        const columns = Object.keys(window.excelData[0]); // İlk satırdaki sütun adlarını alıyoruz
        columns.forEach(col => {
            newRow[col] = ""; // Her sütun için değeri boş string olarak ayarlıyoruz
        });

        // Yeni satırı ekliyoruz
        window.excelData.push(newRow);
        window.bool_misspick = true;
        window.itemIndex = window.excelData.length-1;
        unitEntry.focus();
    }
    
}

upcEntry.addEventListener("keydown", function(event) {
    if (event.key === "Enter") { 
        event.preventDefault(); // Varsayılan Enter davranışını (form gönderme vs.) engelle
        upc_scan();
    }
});

function upc_scan() {
    const searchId = upcEntry.value.trim(); // Kullanıcının girdiği ID
    if (!searchId) {
        alert("Please enter an UPC.");
        return;
    }

    if (!window.excelData) {
        alert("Please upload an Excel file first.");
        return;
    }

    if (isNaN(searchId)) {
        const matchingRows = [];
        window.excelData.forEach((row, realIndex) => {
            if (Object.values(row).some(value => value.toString().toLowerCase().includes(searchId.toLowerCase()))) {
                matchingRows.push({ realIndex, ...row }); // Gerçek index'i de saklıyoruz
            }
        });

        // Sonuçları göster
        displayResults(matchingRows);
    }
    else {
        // JSON verisinde UPC'yi bul
        const foundItem = window.excelData.find(row => row["Upc"] == searchId);
        const itemIndex = window.excelData.findIndex(row => row["Upc"] == searchId);

        // Eğer bulunduysa ekrana yazdır
        if (foundItem) {
            let casepack = foundItem["Case Pack"];
            let shipquantity = foundItem["ShipQuantity"];
            let received = foundItem["Received"];

            let info = "";
            for (let column in foundItem) {
                // Sütun adı ve değeri birleştirip info'ya ekliyoruz
                if (!(column.includes("exp date")) && column != "Status" && column != "Expiring Soon" && column != "Unit")
                    {
                        info += `${column}: ${foundItem[column]}\n`;
                    }
                    
            }
    
            if (typeof shipquantity === "number" && Number.isInteger(shipquantity)) {
                shipquantity = parseInt(shipquantity, 10);
            }
            if (typeof received === "number" && Number.isInteger(received)) {
                received = parseInt(received, 10);
            }
            if (casepack !== null && casepack !== "" && !isNaN(casepack) && casepack !== 0) {
                try {
                    casepack = parseInt(casepack, 10);
            
                    if (casepack === 1) {
                        info += `\n${(shipquantity - received)} UNITS`;
                    } else {
                        if (typeof shipquantity === "number" && Number.isInteger(shipquantity)) {
                            shipquantity = parseInt(shipquantity, 10);
                        }
                        if (typeof received === "number" && Number.isInteger(received)) {
                            received = parseInt(received, 10);
                        }
            
                        let caseCount = Math.floor((shipquantity - received) / casepack);
                        let unitCount = (shipquantity - received) % casepack;
                        info += `\n${caseCount} CASE, ${unitCount} UNITS`
                    }
                } catch (error) {
                    console.error("Error processing casepack:", error);
                }
            }
            infoText.innerText = info;
            itemidEntry.value = foundItem["Item Id"];
            expdateEntry.value = foundItem["exp date"];
            unitEntry.disabled = false;
            damagedEntry.disabled = false;
            expdateEntry.disabled = false;
            datePickButton.disabled = false;
            saveButton.disabled = false;
            maxButton.disabled = false;
            unitEntry.focus();
            window.itemIndex = itemIndex;
            window.bool_misspick = false;
        } else {
            infoText.innerText = "UPC number not found. UPC will be added to end of the file";
            unitEntry.disabled = false;
            damagedEntry.disabled = false;
            expdateEntry.disabled = false;
            datePickButton.disabled = false;
            saveButton.disabled = false;
            window.bool_misspick = true;

            const newRow = {};

            // DataFrame'deki her bir sütun adı için boş bir değer ekliyoruz
            const columns = Object.keys(window.excelData[0]); // İlk satırdaki sütun adlarını alıyoruz
            columns.forEach(col => {
                newRow[col] = ""; // Her sütun için değeri boş string olarak ayarlıyoruz
            });

            // Yeni satırı ekliyoruz
            window.excelData.push(newRow);

            window.itemIndex = window.excelData.length-1;
            unitEntry.focus();
        }

    }

    
    
}

unitEntry.addEventListener("keydown", function(event) {
    if (event.key === "Enter") { 
        event.preventDefault(); // Varsayılan Enter davranışını (form gönderme vs.) engelle
        damagedEntry.focus();
    }
});
damagedEntry.addEventListener("keydown", function(event) {
    if (event.key === "Enter") { 
        event.preventDefault(); // Varsayılan Enter davranışını (form gönderme vs.) engelle
        expdateEntry.focus();
    }
});
expdateEntry.addEventListener("keydown", function(event){
    if (event.key === "Enter") {
        event.preventDefault();
        saveButton.click();
    }
})

function isExpiring(expDate) {
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setDate(today.getDate() + 120); // 120 gün sonrası

    try {
        let splitter = "";
        if (expDate.includes("-")) {
            splitter = "-";
        } else if (expDate.includes("/")) {
            splitter = "/";
        } else if (expDate.includes(".")) {
            splitter = ".";
        }

        let expDateSplitted = expDate.split(splitter);
        if (expDateSplitted.length === 3) {
            if (expDateSplitted[2].length === 2) {
                expDateSplitted[2] = "20" + expDateSplitted[2];
            }
        }

        const formattedExpDate = expDateSplitted.join(splitter);
        const expDateObj = new Date(formattedExpDate);

        if (expDateObj < thresholdDate) {
            // Uyarı mesajı göster
            alert(`Entered Expiration date is expiring soon: ${formattedExpDate}`);
            return [true, formattedExpDate];
        } else {
            return [false, formattedExpDate];
        }
    } catch (error) {
        console.error(error);
        return [false, expDate];
    }
}

function updateExpiration(df, index, newValue) {
    const colName = "exp date";

    // "exp date" ile başlayan tüm sütunları bul
    const expCols = Object.keys(df[index]).filter(col => col.startsWith(colName));

    // Eğer ana sütun boşsa, ilk değeri buraya yaz
    if (df[index][colName] === "") {
        df[index][colName] = newValue;
        return df;
    }

    // Eğer yeni değer zaten varsa değişiklik yapma
    if (expCols.some(col => df[index][col] === newValue)) {
        return df;
    }

    // Yeni bir sütun adı belirle (exp date 2, 3, 4 ...)
    let num = 2;
    while (`${colName} ${num}` in df[index]) {
        num += 1;
    }

    // Yeni sütunu ekle
    df[index][`${colName} ${num}`] = "";

    // Yeni değeri yeni sütuna yaz
    df[index][`${colName} ${num}`] = newValue;

    return df;
}

function refactor_df()
{  
    window.backup_df = JSON.parse(JSON.stringify(window.excelData));
    let index = window.itemIndex
    function nanTo0(x) {
        if ((typeof x === "number" && isNaN(x)) || x === "") {
            return 0;
        }
        return x;
    }
    df = window.excelData
    let unit = window.form_data["unit"];
    let damaged = window.form_data["damaged"];
    let expdate = window.form_data["expdate"];
    const [bool_expiring, form_data_exp_date] = isExpiring(expdate);
    let exp_col = "exp date"
    if (bool_expiring) {
        let expiringSoonValue = parseInt(nanTo0(df[index]["Expiring Soon"]) + nanTo0(unit), 10);
        df[index]["Expiring Soon"] = expiringSoonValue;
    }
    let df_received = parseInt(nanTo0(df[index]["Received"]), 10);
    let df_damaged = parseInt(nanTo0(df[index]["Damaged"]), 10);

    if (unit !== "") {
        df[index]["Received"] = df_received + parseInt(unit, 10);
    } else {
        df[index]["Received"] = df[index]["Received"];
    }
    
    if (damaged !== "") {
        df[index]["Damaged"] = df_damaged + parseInt(damaged, 10);
    } else {
        df[index]["Damaged"] = df[index]["Damaged"];
    }

    df = updateExpiration(df, index, form_data_exp_date);


    df_received = parseInt(nanTo0(df[index]["Received"]), 10);
    df_damaged = parseInt(nanTo0(df[index]["Damaged"]), 10);
    df_shipquantity = parseInt(nanTo0(df[index]["ShipQuantity"]), 10);
    let problem_unit = 0;
    let status = "";
    if (!window.bool_misspick){
        if (df_shipquantity > df_received + df_damaged) {
            problem_unit = df_shipquantity - df_received - df_damaged;
            status = "MISSING";
        }
        else if (df_shipquantity < df_received) {
            problem_unit = df_received - df_shipquantity;
            status = "EXTRA";
        }
        else if (df_shipquantity == df_received) {
            problem_unit = 0;
            status = "OK";
        }
        df[index]["Unit"] = problem_unit;
        df[index]["Status"] = status;
                
    }
    else{
        if (df_shipquantity > df_received + df_damaged) {
            problem_unit = df_shipquantity - df_received - df_damaged;
        }
        else if (df_shipquantity < df_received) {
            problem_unit = df_received - df_shipquantity;
        }
        else if (df_shipquantity == df_received) {
            problem_unit = 0;
        }
        df[index]["Upc"] = upcEntry.value;
        df[index]["Item Id"] = itemidEntry.value;
        df[index]["Unit"] = problem_unit;
        status = "MISSPICK";
        df[index]["Status"] = status;
    }
    window.excelData = df
    infoText.innerText = "Data has been saved succesfully";
    console.log(window.excelData)
}

function submit(){
    window.form_data = {
        "upc": upcEntry.value,
        "itemid": itemidEntry.value,
        "unit": unitEntry.value,
        "damaged": damagedEntry.value,
        "expdate": expdateEntry.value
    };
    refactor_df();
    upcEntry.value = "";
    unitEntry.value = "";
    damagedEntry.value = "";
    expdateEntry.value = "";
    itemidEntry.value = "";

    unitEntry.disabled = true;
    damagedEntry.disabled = true;
    expdateEntry.disabled = true;
    datePickButton.disabled = true;
    saveButton.disabled = true;

    upcEntry.focus();

    undoButton.disabled = false;
    downloadButton.disabled = false;

}
saveButton.addEventListener("click", function(){
    submit();
});
downloadButton.addEventListener("click", function(){
    exportToExcel(window.excelData, window.ExcelName)
});
function exportToExcel(df, fileName = "data.xlsx") {
    // DataFrame'i Sheet'e çevir
    const ws = XLSX.utils.json_to_sheet(df);
    
    // Yeni bir Workbook (çalışma kitabı) oluştur
    const wb = XLSX.utils.book_new();
    
    // Sheet'i ekleyelim
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    
    // Dosyayı indir
    XLSX.writeFile(wb, fileName);
}

