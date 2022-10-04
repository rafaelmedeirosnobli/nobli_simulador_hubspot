const nextURL = "https://nobli.com.br/simulador-step2";
const storage = window.localStorage;

const dueDate = new Date(new Date().setMonth(new Date().getMonth() + 40));

const appkey =
  "C8TEI45TNP8MXF41DBURYPSGO0XDDAFF90KHTF28W0KJ6FAAHWR5BABQ0ZT3Z09Z";

const isFixedIncome = (code) => {
  return ["CDB", "LCA", "LCI"].includes(code);
};

//SEGMENT

const writeKey = "zNDcqzRNGzmMsupIkpQkvrvFIIgRBgGA";

console.log('app running on the write key - ', writeKey);

const sendEventToSegment = async () => {
  console.log(' - Beginning to call segment api - ');
  const event = {
    userId: 'telemetria@nobli.com.br',
    event: `15 + 001`,
    type: 'track',
    properties: {
      timestamp: Date.now().toString(),
      process: "Simulação",
      subProcess: "Investimentos com garantia",
      campo_6: "Simule 2",
      campo_9: 'www.nobli.com.br/simule'
    },
  };

  const response = await axios.post(
    `https://api.segment.io/v1/track`,
    event,
    {
      auth: {
        username: writeKey ,
        password: ""
      }
    }
  );
  
  console.log(' - Response from segment api - ', response);
};

sendEventToSegment()

//SEGMENT

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

const handlePersistStorage = (name, values) => {
  storage.setItem(name, JSON.stringify(values));
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

const handleNextStep = () => {
  window.location.href = nextURL;
};

const handleFetchLimits = async () => {
  const { renda_fixa, acao, outros } = handleGetValuesFormInputs();

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

  $("#loading-section").css({
    display: "flex",
  });

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
    installment_requested: "3",
    amount_requested: "5000",
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

    return true;
  }

  return false;
};

const handleAddFnButtonNext = () => {
  const btnElm = document.querySelector("#button-next-step");

  if (btnElm) {
    btnElm.addEventListener("click", async () => {
      handlePersistStorage("assets", handleGetValuesFormInputs());

      const success = await handleFetchLimits();

      if (success) {
        handleNextStep();
      }
    });
  }
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



const handleReady = () => {
  handleAddFnButtonNext();
  handleInsertMasks();
  handleUpdateDisabled();
};

$(document).ready(handleReady);
