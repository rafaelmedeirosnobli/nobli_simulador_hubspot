const nextURL = "https://nobli.com.br/simulador-step4";
const storage = window.localStorage;

const appkey =
  "C8TEI45TNP8MXF41DBURYPSGO0XDDAFF90KHTF28W0KJ6FAAHWR5BABQ0ZT3Z09Z";




const handlePersistStorage = (name, values) => {
  storage.setItem(name, JSON.stringify(values));
};

const handleUpdateDisabled = () => {
  let values = {
    checkbox: false,
  };

  const btnElm = document.querySelector("#button-next-step");

  const handleUpdateAttrBtn = () => {
    const hasValue = Object.values(values).every((v) => !!v);

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

  $("input[type='checkbox']").on("input", (elm) => {
    values = {
      ...values,
      checkbox: elm.target.checked,
    };

    handleUpdateAttrBtn();
  });

  handleUpdateAttrBtn();
};

const handleUpdateValuesFromStorage = () => {
  const amount = JSON.parse(storage.getItem("assetsResult")).limits[0]
    .granted_amount;

  const requestLimit = JSON.parse(storage.getItem("requestLimit"));

  $(".amount-available").text(
    Number(amount).toLocaleString("pt-br", {
      style: "currency",
      currency: "BRL",
    })
  );

  $("input[name='amount']").val(requestLimit.amount_requested);
  $("input[name='installments']").val(requestLimit.installment_requested);
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

  $('input[name="installments"]').inputmask("decimal", {
    rightAlign: false,
    suffix: " Meses",
    max: 12,
    placeholder: "3 Meses",
  });

  $('input[name="telefone"]').inputmask("(99) 99999-9999");
};

const handleNextStep = () => {
  window.location.href = nextURL;
};

const handleCreateLead = async () => {
  $("#loading-section").css({
    display: "flex",
  });

  const first_name = $('input[name="nome"]').val();
  const last_name = $('input[name="sobrenome"]').val();
  const email = $('input[name="email"]').val();

  const requestLimit = JSON.parse(storage.getItem("requestLimit"));
  
  const body = {
    first_name,
    last_name,
    email,
    installment_requested: requestLimit.installment_requested,
    amount_requested: requestLimit.amount_requested,
    identifier_lead: null,
    notify: false,
  };

  const { data, status } = await axios.post(
    `https://fcop0002.nobli.com.br/api/simulations/`,
    body,
    {
      headers: { appkey: appkey },
    }
  );

  $("#loading-section").css({
    display: "none",
  });

  if (status === 200) {
    handlePersistStorage("simulationResult", data);
    handlePersistStorage("lead", body);

    return true;
  }

  return false;
};

const handleAddFnButtonNext = () => {
  const btnElm = document.querySelector("#button-next-step");

  if (btnElm) {
    btnElm.addEventListener("click", async () => {
      const success = await handleCreateLead();

      if (success) {
        handleNextStep();
      }
    });
  }
};


  
const handleReady = () => {
  if (storage.getItem("lead")) {
    return handleNextStep();
  }

  handleUpdateDisabled();
  handleUpdateValuesFromStorage();
  handleInsertMasks();
  handleAddFnButtonNext();
};

//SEGMENT

const writeKey = "zNDcqzRNGzmMsupIkpQkvrvFIIgRBgGA";

console.log('app running on the write key - ', writeKey);

const sendEventToSegment = async () => {
  console.log(' - Beginning to call segment api - ');
  const event = {
    userId: 'email',
    event: `15 + 001`,
    type: 'track',
    properties: {
      timestamp: Date.now().toString(),
      process: "Simulação",
      subProcess: "Investimentos com garantia",
      campo_1: 'CDB',
      campo_2: 'ACA',
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

$(document).ready(handleReady);
