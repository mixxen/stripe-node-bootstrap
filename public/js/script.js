var stripeResponseHandler = function(status, response) {
  var $form = $('#payment-form');

  if (response.error) {
    // Show the errors on the form
    $form.find('.payment-errors').removeClass('hidden').text(response.error.message);
    $form.find('button').prop('disabled', false);
  } else {
    // token contains id, last4, and card type
    var token = response.id;
    // Insert the token into the form so it gets submitted to the server
    $form.append($('<input type="hidden" name="stripeToken" />').val(token));
    // and re-submit
    $form.get(0).submit();
  }
};

jQuery(function($) {


  $('[data-numeric]').payment('restrictNumeric');
  $('.cc-number').payment('formatCardNumber');
  $('.cc-exp').payment('formatCardExpiry');
  $('.cc-cvc').payment('formatCardCVC');

  $('form').submit(function(e){
    e.preventDefault();
    
    $('.payment-errors').addClass('hidden');
    $('div').removeClass('has-error');

    var cardType = $.payment.cardType($('.cc-number').val());

    $('.cc-number-div').toggleClass('has-error', !$.payment.validateCardNumber($('.cc-number').val()));
    $('.cc-exp-div').toggleClass('has-error', !$.payment.validateCardExpiry($('.cc-exp').payment('cardExpiryVal')));
    $('.cc-cvc-div').toggleClass('has-error', !$.payment.validateCardCVC($('.cc-cvc').val(), cardType));

    if ( $('div.has-error').length ) {

      $('.payment-errors').removeClass('hidden').text('Please fix fields in red and try again.');

    } else {

      var $form = $(this);

      // Parse the date
      var monthyear = $('.cc-exp').val().split('/');
      $form.append($('<input type="hidden" data-stripe="exp-month" />').val(monthyear[0].trim()));
      $form.append($('<input type="hidden" data-stripe="exp-year" />').val(monthyear[1].trim()));

      // Disable the submit button to prevent repeated clicks
      $form.find('button').prop('disabled', true);

      Stripe.card.createToken($form, stripeResponseHandler);

      // Prevent the form from submitting with the default action
      return false;

    }
  });
});
