const storage = window.localStorage;

const handleUpdateValuesFromStorage = () => {
  const amountAvailable = JSON.parse(storage.getItem("assetsResult")).limits[0]?.granted_amount;
  
  const requestedAmount = JSON.parse(storage.getItem("assetsResult")).quotation.requested_amount;
  
  const assetsResult = JSON.parse(storage.getItem("assetsResult"));
  
  $(".requested_amount").text(
    Number(requestedAmount).toLocaleString("pt-br", {
      style: "currency",
      currency: "BRL",
    })
  );
  
  $(".amount-available").text(
    Number(amountAvailable).toLocaleString("pt-br", {
      style: "currency",
      currency: "BRL",
    })
  );

  $(".installment_amount").text(
    Number(assetsResult.quotation.installment_amount).toLocaleString("pt-br", {
      style: "currency",
      currency: "BRL",
    })
  );

  $(".installment_payment span").text(assetsResult.quotation.installment_total);

  $(".tax_payment span").text(
    Number(assetsResult.quotation.interest_rate_month / 100).toLocaleString(
      "pt-br",
      {
        style: "percent",
        minimumFractionDigits: 2,
      }
    )
  );

  $(".cet_payment span").text(
    Number(assetsResult.quotation.cet / 100).toLocaleString("pt-br", {
      style: "percent",
      minimumFractionDigits: 2,
    })
  );
};

const handleReady = () => {
  handleUpdateValuesFromStorage();

  const assetsResult = JSON.parse(storage.getItem("assetsResult"));

  if (!assetsResult.quotation.approved) {
    $(".success-container").css({
      display: "none",
    });

    $(".nofound-container").css({
      display: "flex",
    });
  }
};

$(document).ready(handleReady);
