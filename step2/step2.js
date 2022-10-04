const nextURL = "https://nobli.com.br/simulador-step3";
const currentModule = "step2";
const storage = window.localStorage;

const appkey =
  "C8TEI45TNP8MXF41DBURYPSGO0XDDAFF90KHTF28W0KJ6FAAHWR5BABQ0ZT3Z09Z";

const handleNextStep4 = () => {
  window.location.href = "https://nobli.com.br/simulador-step4";
};

const handleGetValuesFormInputs = () => {
  const inputs = Array.from($("[requiredValue]"));

  const obj = inputs.reduce((acc, curr) => {
    return {
      ...acc,
      [curr.name]: curr.value,
    };
  }, {});

  return obj;
};

const dueDate = new Date(new Date().setMonth(new Date().getMonth() + 40));

const isFixedIncome = (code) => {
  return ["CDB", "LCA", "LCI"].includes(code);
};

const mapFixedIncomeToAssetRequest = (c) => {
  const fgcCoverageAmount = 250000;

  let assets = [];

  let amountTotal = c.amount;

  // 250 mil cobertura do FGC
  const totalAsset = amountTotal / fgcCoverageAmount;

  if (totalAsset >= 1.12) {
    let total = 0;
    while (total < totalAsset) {
      let amountAsset = fgcCoverageAmount;
      if (total === parseInt(totalAsset.toString())) {
        amountAsset = amountTotal;
      }
      assets.push({
        product_name: c.product_name,
        due_date: c.dueDate,
        amount: amountAsset,
      });

      amountTotal -= fgcCoverageAmount;
      total++;
    }
  } else {
    assets.push({
      product_name: c.product_name,
      due_date: c.dueDate,
      amount: c.amount,
    });
  }

  return assets;
};

const handleFetchLimits = async (amount, installments = "3") => {
  $("#loading-section").css({
    display: "flex",
  });
  
  const { renda_fixa, acao, outros } = handleGetAssetsValuesFormInputs();
  
  let assets = [];

  if (renda_fixa) {
    assets.push({
      id: "ee9614ec-b98d-4314-9b7e-2fb900137f11",
      name: "Renda Fixa",
      product_name: "CDB",
      ticker: "-",
      dueDate: dueDate,
      amount: renda_fixa,
      helperText: "São considerados os ativos: CDB, LCI e LCA",
    });
  }

  if (acao) {
    assets.push({
      id: "9729fd17-9314-4d36-8e23-badbfed18de5",
      name: "Ação",
      product_name: "ETF",
      ticker: "BOVA11",
      dueDate: null,
      amount: acao,
      helperText: "São considerados ações negociadas na B3",
    });
  }

  if (outros) {
    assets.push({
      id: "d6a57bd0-6653-4dd2-b6f9-b0f749ec73b5",
      name: "FII, BDR, BDR e outros",
      product_name: "ETF",
      ticker: "BOVA11",
      dueDate: null,
      amount: outros,
      helperText: "São considerados ativos negociadas na B3",
    });
  }
  
  let newAssets = [];
  
  const responseEquities = await axios.get(
    `https://fcop0002.nobli.com.br/api/equities/`,
    { headers: { appkey: appkey } }
  );
  
  const equities = responseEquities.data;

  for (let c of assets) {
    if (c.amount === "" || c.amount === 0) {
      continue;
    }
    if (isFixedIncome(c.product_name)) {
      const fixedAssets = mapFixedIncomeToAssetRequest(c);
      newAssets = newAssets.concat(fixedAssets);
      continue;
    }

    const equity = equities.find((equity) => equity.ticker === c.ticker);
    const quantityAssets = c.amount / equity.closing_price;
    newAssets.push({
      product_name: c.product_name,
      ticker: c.ticker,
      quantity: parseInt(quantityAssets.toString()),
    });
  }

  newAssets = newAssets.filter((asset) => asset);

  const requestLimit = {
    installment_requested: installments,
    amount_requested: amount,
    assets: newAssets,
  };

  const { data, status } = await axios.post(
    `https://fcop0002.nobli.com.br/api/limits/`,
    requestLimit,
    {
      headers: { appkey: appkey },
    }
  );

  $("#loading-section").css({
    display: "none",
  });

  if (status === 200) {
    handlePersistStorage("assetsResult", data);
    handlePersistStorage("requestLimit", requestLimit);
    handlePersistStorage("assets", handleGetAssetsValuesFormInputs());
    return true;
  }

  return false;
};

const handleAddFnButtonNext = () => {
  const btnElm = document.querySelector("#button-next-step");

  if (btnElm) {
    btnElm.addEventListener("click", async () => {
      const amountValue = $("input[name='amount']").val();
      const installmentValue = $("input[name='installments']")
        .val()
        .replace(/\D/g, "");

      const success = await handleFetchLimits(
        amountValue || "5000",
        installmentValue || "3"
      );

      if (success) {
        if (storage.getItem("lead")) {
          handleNextStep4();
        }else{
          handleNextStep();
        }
      }
    });
  }
};

const handlePersistStorage = (name, values) => {
  storage.setItem(name, JSON.stringify(values));
};

const handleNextStep = () => {
  window.location.href = nextURL;
};

const handleUpdateValuesFromStorage = () => {
  const amount = JSON.parse(storage.getItem("assetsResult")).limits[0]
    ?.granted_amount;

  const assets = JSON.parse(storage.getItem("assets"));
  
  if(amount){
    $(".amount-available").text(
    Number(amount).toLocaleString("pt-br", {
      style: "currency",
      currency: "BRL",
    })
  );
  }else{
    $("#sem-limite").text("Sem limite disponível, Adicione mais garantias");
    $(".amount-available").text("R$ 0,00");
  }
  
  

  $("input[name='renda_fixa']").val(assets.renda_fixa);
  $("input[name='acao']").val(assets.acao);
  $("input[name='outros']").val(assets.outros);
};

const handleInsertMasks = () => {
  $("[input-mask-currency]").inputmask("currency", {
    autoUnmask: true,
    radixPoint: ",",
    groupSeparator: ".",
    allowMinus: false,
    prefix: "R$ ",
    digits: 2,
    digitsOptional: true,
    rightAlign: false,
    unmaskAsNumber: true,
  });

  $("[input-mask-currency-min]").inputmask("currency", {
    autoUnmask: true,
    radixPoint: ",",
    groupSeparator: ".",
    allowMinus: false,
    prefix: "R$ ",
    digits: 2,
    digitsOptional: true,
    rightAlign: false,
    unmaskAsNumber: true,
    min: 5000,
  });

  $('input[name="installments"]').inputmask("decimal", {
    rightAlign: false,
    suffix: " Meses",
    max: 36,
    min: 3,
    placeholder: "3 Meses",
  });
};

const handleUpdateDisabled = () => {
  let values = {};

  const btnElm = document.querySelector("#button-next-step");

  const handleUpdateAttrBtn = () => {
    const hasValue = Object.values(values).some((v) => !!v);

    if (!hasValue) {
      btnElm.setAttribute("disabled", "true");
    } else {
      btnElm.removeAttribute("disabled");
    }
  };

  $("[requiredValue]").on("input", (elm) => {
    const { name, value } = elm?.currentTarget || {};

    values = {
      ...values,
      [name]: value,
    };

    handleUpdateAttrBtn();
  });

  handleUpdateAttrBtn();
};

const handleGetAssetsValuesFormInputs = () => {
  const inputs = Array.from($("[assetInput]"));

  const obj = inputs.reduce((acc, curr) => {
    return {
      ...acc,
      [curr.name]: curr.value,
    };
  }, {});

  return obj;
};

const handleReady = () => {
  handleAddFnButtonNext();
  handleInsertMasks();
  handleUpdateValuesFromStorage();
  handleUpdateDisabled();
};

$(document).ready(handleReady);
