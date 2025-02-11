/**
 * @file
 * Provide client-side validation for FOIA Annual Report.
 */

 (function ($, drupalSettings, Drupal) {

  Drupal.behaviors.foia_ui_validation = {
    attach: function attach() {
      jQuery.validator.setDefaults({
        ignore: ".ignore-validation",
        onsubmit: false
      });

      /**
       * Alias Drupal.FoiaUI utility functions
       */
      var specialNumber = Drupal.FoiaUI.specialNumber;
      var getAgencyComponent = Drupal.FoiaUI.getAgencyComponent;
      var hasAgencyComponent = Drupal.FoiaUI.hasAgencyComponent;

      /**
       * Added for ie11 compatibility.
       *
       * @param value
       * @returns {boolean}
       */
      function isInteger(value) {
        return typeof value === 'number' &&
            isFinite(value) &&
            Math.floor(value) === value;
      }

      /**
       * Return Oldest Days ordinal number with suffix
       */
      function oldestOrdinal(value) {
        switch (value) {
          case 1:
            return "Oldest";
          case 2:
            return value + "nd";
          case 3:
            return value + "rd";
          default:
            return value + "th";
        }
      }

      /**
       * Checks that a date is in the format of YYYY-MM-DD
       *
       * @param dateString
       * @returns {boolean}
       */
      function isIsoDateFormat(dateString) {
        return (new RegExp(/^\d{4}[\-]\d{2}[\-]\d{2}$/)).test(dateString);
      }

      /**
       * Checks that a date in the YYYY-MM-DD format is valid.
       *
       * @param isoDateString
       */
      function isoDateStringIsValidDate(isoDateString) {
        var year = Number(isoDateString.substr(0, 4)),
            month = Number(isoDateString.substr(5, 2)),
            day = Number(isoDateString.substr(8, 2));

        if (!isInteger(year) || !isInteger(month) || !isInteger(day)) {
          return false;
        }

        if (month < 1 || month > 12) {
          return false;
        }

        var date = new Date(year, (month - 1), day);

        return (Boolean(+date) && date.getDate() === day);
      }

      /**
       * Runs validation for a single element except on certain keyup events.
       *
       * This is based on jquery.validate.js onkeyup method.
       *
       * @param event
       * @param element
       */
      function revalidateOnKeyup(event, element) {
        var validator = $(drupalSettings.foiaUI.foiaUISettings.formID).validate();
        // Avoid revalidate the field when pressing one of the following keys
        // Shift       => 16
        // Ctrl        => 17
        // Alt         => 18
        // Caps lock   => 20
        // End         => 35
        // Home        => 36
        // Left arrow  => 37
        // Up arrow    => 38
        // Right arrow => 39
        // Down arrow  => 40
        // Insert      => 45
        // Num lock    => 144
        // AltGr key   => 225
        var excludedKeys = [
          16, 17, 18, 20, 35, 36, 37,
          38, 39, 40, 45, 144, 225
        ];

        if ($.inArray( event.keyCode, excludedKeys ) !== -1 ) {
          return;
        } else {
          validator.element( element );
        }
      }

      /**
       * Custom validation methods
       */
      // lessThanEqualTo
      $.validator.addMethod( "lessThanEqualTo", function (value, element, param ) {
        value = specialNumber(value);
        var target = specialNumber($( param ).val());
        return value <= target;
      }, "Please enter a lesser value." );

       // greaterThanEqualTo
      $.validator.addMethod( "greaterThanEqualTo", function (value, element, param ) {
        value = specialNumber(value);
        var target = specialNumber($( param ).val());
        return value >= target;
      }, "Please enter a greater value." );

       // greaterThanZero
       $.validator.addMethod( "greaterThanZero", function (value, element, param ) {
        return value > 0;
      }, "Please enter a value greater than zero." );

       // greaterThanZeroOrNA
       $.validator.addMethod( "greaterThanZeroOrNA", function (value, element, param ) {
        switch (String(value).toLowerCase()) {
          case "n/a":
          case "<1":
            return true;
        }
        return value > 0;
      }, "Please enter a value greater than zero." );

      // notNegative
      $.validator.addMethod( "notNegative", function (value, element, param ) {
        return value >= 0;
      }, "Please enter zero or a positive number." );

      // ifGreaterThanZeroComp
      jQuery.validator.addMethod("ifGreaterThanZeroComp", function (value, element, params) {
        var elementAgencyComponent = getAgencyComponent(element);
        if (hasAgencyComponent(elementAgencyComponent)) {
          for (var i = 0; i < params.length; i++){
            var paramAgencyComponent = getAgencyComponent(params[i]);
            if (paramAgencyComponent === elementAgencyComponent) {
              var target = Number($( params[i] ).val());
            }
          }
          if (target > 0 ) {
            return this.optional(element) || value > 0;
          }
          else {
            return  this.optional(element) || true;
          }
        }
        else {
          return 'dependency-mismatch';
        }
      }, "Must be greater than or equal to a field.");

      // equalSumComp
      jQuery.validator.addMethod("equalSumComp", function (value, element, params) {
        var sum = 0;
        for (var i = 0; i < params.length; i++){
          sum += Number($( params[i] ).val());
        }
        return this.optional(element) || value === sum;
      }, "Must equal sum of fields.");

      // lessThanEqualSum
      jQuery.validator.addMethod("lessThanEqualSum", function (value, element, params) {
        var sum = 0;
        params.forEach(function (param) {
          sum += Number($(param).val());
        });
        return this.optional(element) || value <= sum;
      }, "Must equal less than equal a sum of other fields.");

      // lessThanEqualSumComp
      jQuery.validator.addMethod("lessThanEqualSumComp", function (value, element, params) {
        value = specialNumber(value);
        var sum = 0;
        var elementAgencyComponent = getAgencyComponent(element);
        if (hasAgencyComponent(elementAgencyComponent)) {
          for (var i = 0; i < params.length; i++){
            for (var j = 0; j < params[i].length; j++){
              var paramAgencyComponent = getAgencyComponent(params[i][j]);
              if (paramAgencyComponent === elementAgencyComponent) {
                sum += specialNumber($( params[i][j] ).val());
              }
            }
          }
          return this.optional(element) || value <= sum;
        }
        else {
            return 'dependency-mismatch';
        }
      }, "Must be less than or equal to a field.");

      // multiLessThanEqualSumComp
      jQuery.validator.addMethod("multiLessThanEqualSumComp", function (value, element, params) {
        value = specialNumber(value);
        var sum = 0;
        var target = 0;
        params.multiFields.forEach(function (multiField) {
          var sumElement = $(element).parents('.paragraphs-subform').find("input[name*='" + multiField + "']");
          sum += specialNumber($(sumElement).val());
        });
        var elementAgencyComponent = getAgencyComponent(element);
        if (hasAgencyComponent(elementAgencyComponent)) {
          for (var i = 0; i < params.target.length; i++){
            var paramAgencyComponent = getAgencyComponent(params.target[i]);
            if (paramAgencyComponent === elementAgencyComponent) {
              target = specialNumber($( params.target[i] ).val());
            }
          }
          return this.optional(element) || sum <= target;
        }
        else {
            return 'dependency-mismatch';
        }
      }, "Sum of fields must be less than or equal to a field.");

      // equalToComp
      jQuery.validator.addMethod("equalToComp", function (value, element, params) {
        var elementAgencyComponent = getAgencyComponent(element);
        if (hasAgencyComponent(elementAgencyComponent)) {
          for (var i = 0; i < params.length; i++){
            var paramAgencyComponent = getAgencyComponent(params[i]);
            if (paramAgencyComponent === elementAgencyComponent) {
              var target = Number($( params[i] ).val());
              return this.optional(element) || value === target;
            }
          }
        }
        else {
          return 'dependency-mismatch';
        }
      }, "Must be equal to a field.");

      // lessThanEqualComp
      jQuery.validator.addMethod("lessThanEqualComp", function (value, element, params) {
        value = specialNumber(value);
        var elementAgencyComponent = getAgencyComponent(element);
        if (hasAgencyComponent(elementAgencyComponent)) {
          for (var i = 0; i < params.length; i++){
            var paramAgencyComponent = getAgencyComponent(params[i]);
            if (paramAgencyComponent === elementAgencyComponent) {
              var target = specialNumber($( params[i] ).val());
              return this.optional(element) || value <= target;
            }
          }
        }
        else {
            return 'dependency-mismatch';
        }
      }, "Must be less than or equal to a field.");

      // lessThanEqualOlderComp
      jQuery.validator.addMethod("lessThanEqualOlderComp", function (value, element, params) {
        value = specialNumber(value);
        var target = Number($(element).parents('.paragraphs-subform').find("input[name*='" + params + "']").val());
        return this.optional(element) || value <= target;
      }, "Must be less than or equal to a field.");

      // greaterThanEqualComp
      jQuery.validator.addMethod("greaterThanEqualComp", function (value, element, params) {
        var elementAgencyComponent = getAgencyComponent(element);
        if (hasAgencyComponent(elementAgencyComponent)) {
          for (var i = 0; i < params.length; i++){
            var paramAgencyComponent = getAgencyComponent(params[i]);
            if (paramAgencyComponent === elementAgencyComponent) {
              var target = Number($( params[i] ).val());
              return this.optional(element) || value >= target;
            }
          }
        }
        else {
            return 'dependency-mismatch';
        }
      }, "Must be greater than or equal to a field.");

      jQuery.validator.addMethod("greaterThanEqualSumComp", function (value, element, params) {
        var elementAgencyComponent = getAgencyComponent(element);
        if (hasAgencyComponent(elementAgencyComponent)) {
          var sum = 0;
          for (var i = 0; i < params.length; i++) {
            var paramAgencyComponent = getAgencyComponent(params[i]);
            if (paramAgencyComponent === elementAgencyComponent) {
              sum += Number($( params[i] ).val());
            }
          }
          return this.optional(element) || value >= sum;
        }
        else {
          return 'dependency-mismatch';
        }
      }, "Must be greater than or equal to sum of the fields.");

      // betweenMinMaxCompNA
      jQuery.validator.addMethod("betweenMinMaxCompNA", function (value, element, params) {
        value = specialNumber(value);
        var valuesArray = [];
        for (var i = 0; i < params.length; i++){
          valuesArray.push(specialNumber($( params[i] ).val()));
        }
        var min = Math.min.apply(null, valuesArray);
        var max = Math.max.apply(null, valuesArray);
        return this.optional(element) || (value >= min) && (value <= max);
      }, "Must be between the smallest and largest values.");

      // equalToLowestComp
      jQuery.validator.addMethod("equalToLowestComp", function (value, element, params) {
        value = specialNumber(value);
        var valuesArray = [];
        for (var i = 0; i < params.length; i++){
          valuesArray.push(specialNumber($( params[i] ).val()));
        }
        return this.optional(element) || (value === Math.min.apply(null, valuesArray));
      }, "Must equal the lowest value.");

      // equalToHighestComp
      jQuery.validator.addMethod("equalToHighestComp", function (value, element, params) {
        value = specialNumber(value);
        var valuesArray = [];
        for (var i = 0; i < params.length; i++){
          valuesArray.push(specialNumber($( params[i] ).val()));
        }
        return this.optional(element) || (value === Math.max.apply(null, valuesArray));
      }, "Must equal the highest value.");

      // isoDateFormattedOrNA
      jQuery.validator.addMethod('isoDateFormattedOrNA', function (value, element) {
        if (value.toLowerCase() === 'n/a' || value === '0') {
          return true;
        }

        return this.optional(element) || isIsoDateFormat(value);
      }, "Date must be formatted as YYYY-MM-DD.");

      /**
       * isoDateStringIsValid
       *
       * Check that a properly formatted YYYY-MM-DD string is a valid date.
       *
       * Requires running the isoDateFormattedOrNA method prior to this
       * validation to ensure that no errors in the date format before
       * validating.
       */
      jQuery.validator.addMethod('isoDateStringIsValid', function (value, element) {
        if (value.toLowerCase() === 'n/a' || value === '0') {
          return true;
        }

        return this.optional(element) || isoDateStringIsValidDate(value);
      }, "Must be a valid date.");

      // notAverageCompNA
      jQuery.validator.addMethod("notAverageCompNA", function (value, element, params) {
        value = specialNumber(value);
        var sum = 0;
        for (var i = 0; i < params.length; i++){
          sum += specialNumber($( params[i] ).val());
        }
        var average = sum/params.length;
        return this.optional(element) || !(value === average);
      }, "Must not be equal to the average.");

      // greaterThanZeroSumComp
      jQuery.validator.addMethod("greaterThanZeroSumComp", function (value, element, params) {
        var elementAgencyComponent = getAgencyComponent(element);
        if (hasAgencyComponent(elementAgencyComponent)) {
          var sum = 0;
          if (value > 0) {
            for (var i = 0; i < params.length; i++) {
              for (var j = 0; j < params[i].length; j++) {
                var paramAgencyComponent = getAgencyComponent(params[i][j]);
                if (paramAgencyComponent === elementAgencyComponent) {
                  sum += Number($(params[i][j]).val());
                }
              }
            }
            return this.optional(element) || sum > 0;
          }
          else {
            return true;
          }
        }
        else {
          return 'dependency-mismatch';
        }
      }, "Sum of the fields must be greater than zero.");

      // vb1matchDispositionComp: hard-coded for V.B.(1)
      jQuery.validator.addMethod("vb1matchDispositionComp", function (value, element, params) {
        var allReqProcessedYr = $( "input[name*='field_foia_requests_va']").filter("input[name*='field_req_processed_yr']");
        var elementAgencyComponent = getAgencyComponent(element);
        if (hasAgencyComponent(elementAgencyComponent)) {
          var reqProcessedYr = null;
          var otherField = null;
          var sumVIICTotals = 0;

          for (var i = 0; i < allReqProcessedYr.length; i++){
            var paramAgencyComponent = getAgencyComponent(allReqProcessedYr[i]);
            if (paramAgencyComponent === elementAgencyComponent) {
              var reqProcessedYr = Number($( allReqProcessedYr[i] ).val());
            }
          }

          for (var i = 0; i < params.viicn.length; i++){
            var paramAgencyComponent = getAgencyComponent(params.viicn[i]);
            if (paramAgencyComponent === elementAgencyComponent) {
              sumVIICTotals += Number($( params.viicn[i] ).val());
            }
          }

          for (var i = 0; i < params.otherField.length; i++){
            var paramAgencyComponent = getAgencyComponent(params.otherField[i]);
            if (paramAgencyComponent === elementAgencyComponent) {
              otherField = Number($( params.otherField[i] ).val());
            }
          }

          // reqProcessedYr === sumVIICTotals - Improper Request for Other - Records Not Reasonably Described
          return (reqProcessedYr === sumVIICTotals - Number(value) - otherField);
        }
        else {
          return 'dependency-mismatch';
        }
      }, "Must not be equal to the average.");

      /**
       * Form validation call
       */
      $(drupalSettings.foiaUI.foiaUISettings.formID).validate({

        // Show errors using the built in defaultShowErrors() method
        // and then highlight tabs all at once.
        showErrors: function (errors) {
          this.defaultShowErrors();
          this.settings.highlightTabs();
        },

        // Highlight top level tabs only.
        highlightTabs: function () {
          // Gets only the top level of vertical tab menu items.
          var tabs = document.querySelector('.js-vertical-tabs--main > .vertical-tabs > .vertical-tabs__menu');

          $('> .vertical-tabs__menu-item', tabs).each(function (index, menuItem) {
            try {
              var link = $('> a', menuItem).get(0),
                  tabId = link.getAttribute('href') || false;
            }
            catch (error) {
              tabId = false;
            }

            if (!tabId) {
              return;
            }

            // Attempt to get the first form element that is a child of
            // the current tab.  If there is at least one form element that has
            // the class .error, highlight this tab.
            var tab = document.getElementById(tabId.substr(1)),
              error = tab.querySelector('.error:not(label)');

            if (error) {
              $(menuItem).addClass('has-validation-error');
            }
            else {
              $(menuItem).removeClass('has-validation-error');
            }
        });
        }
      });

      if ($('#validation-overlay').length === 0) {
        $('body').append('<div id="validation-overlay"' +
            ' class="validation-overlay hidden">' +
            '<div class="ajax-progress ajax-progress-fullscreen">' +
            '<img src="/core/misc/loading-small.gif" />' +
            '</div></div>');
      }

      $('input#edit-validate-button').once('foia-validation').on('click', function (event) {
        event.preventDefault();

        $('.validation-overlay').removeClass('hidden');

        // To validate select drop-downs as required, they must have an
        // empty machine value.
        $("select > option[value='_none']").val('');


        // Allow some time for the overlay to render.
        setTimeout(function () {
          // Validate form
          $(drupalSettings.foiaUI.foiaUISettings.formID).valid();

          $('.validation-overlay').addClass('hidden');

          // Empty drop-downs can still be submitted though, so restore
          // Drupal's default empty drop-down value to avoid "An illegal
          // choice has been detected" error in that scenario.
          $("select > option[value='']").val('_none');
        }, 100);
      });

      /**
       * Validation rules
       *
       * Note: All validation rules can be bypassed on submit.
       */
      // Require all Annual Report fields.
      $(".form-text, .form-textarea, .form-select, .form-number, .form-date").not('#edit-revision-log-0-value').not('[readonly]').not('[id*="footnote"]').each(function () {
        $(this).rules( "add", {
        required: true,
        });
      });

      // Formatting and validity of date fields that accept text.
      $("input[name^='field_admin_app_vic5']").filter('input[name*="field_date_"]')
          .add("input[name^='field_admin_app_viie']").filter('input[name*="field_date_"]')
          .add("input[name^='field_foia_xiic']").filter('input[name*="field_date_"]')
          .add("input[name^='field_overall_vic5_date']")
          .add("input[name^='field_overall_viie_date']")
          .add("input[name^='field_overall_xiic_date']")
          .filter('.form-text')
          .each(function () {
            $(this).rules("add", {
              isoDateFormattedOrNA: true,
              isoDateStringIsValid: true,
            });
          });

       // V.A. FOIA Requests
      $( "input[name*='field_foia_requests_va']").filter("input[name*='field_req_processed_yr']").each(function () {
        $(this).rules( "add", {
          equalToComp: $( "input[name*='field_foia_requests_vb1']").filter("input[name*='field_total']"),
          greaterThanEqualSumComp: $( "input[name*='field_proc_req_viic1']").filter("input[name*='field_total']")
            .add( "input[name*='field_proc_req_viic2']").filter("input[name*='field_total']")
            .add( "input[name*='field_proc_req_viic3']").filter("input[name*='field_total']"),
          messages: {
            equalToComp: "Must match corresponding agency V.B.(1) Total",
            greaterThanEqualSumComp: "Must be greater than or equal to sum of all of the Totals of VII.C.1, 2, and 3 for the corresponding agency/component"
          }
        });
      });

      // V.A. Agency Overall Number of Requests Processed in Fiscal Year
      $( "#edit-field-overall-req-processed-yr-0-value").rules( "add", {
        equalTo: "#edit-field-overall-vb1-total-0-value",
        messages: {
          equalTo: "Must match V.B.(1) Agency Overall Total"
        }
      });

      // V.B.(1) Records Not Reasonably Described
      $( "input[name*='field_foia_requests_vb1']").filter("input[name*='field_rec_not_desc']").each(function () {
        $(this).rules( "add", {
          vb1matchDispositionComp: {
            viicn: $( "input[name*='field_proc_req_viic1']").filter("input[name*='field_total']")
              .add( "input[name*='field_proc_req_viic2']").filter("input[name*='field_total']")
              .add( "input[name*='field_proc_req_viic3']").filter("input[name*='field_total']"),
            otherField: $( "input[name*='field_foia_requests_vb1']").filter("input[name*='field_imp_req_oth_reason']"),
          },
          messages: {
            vb1matchDispositionComp: "Should equal V.A. Requests Processed less sum of Total of VII.C.1, 2, and 3. less Improper FOIA Request for Other Reason"
          }
        });
      });

      // V.B.(1) Improper FOIA Request for Other Reason
      $( "input[name*='field_foia_requests_vb1']").filter("input[name*='field_imp_req_oth_reason']").each(function () {
        $(this).rules( "add", {
          vb1matchDispositionComp: {
            viicn: $( "input[name*='field_proc_req_viic1']").filter("input[name*='field_total']")
              .add( "input[name*='field_proc_req_viic2']").filter("input[name*='field_total']")
              .add( "input[name*='field_proc_req_viic3']").filter("input[name*='field_total']"),
            otherField: $( "input[name*='field_foia_requests_vb1']").filter("input[name*='field_rec_not_desc']"),
          },
          messages: {
            vb1matchDispositionComp: "Should equal V.A. Requests Processed less sum of Total of VII.C.1, 2, and 3. less Records Not Reasonably Described"
          }
        });
      });

      // V.B.(1) Agency Overall Number of Full Denials Based on Exemptions
      $( "#edit-field-overall-vb1-full-denials-e-0-value").rules( "add", {
        lessThanEqualSum: [
          "#edit-field-overall-vb3-ex-1-0-value",
          "#edit-field-overall-vb3-ex-2-0-value",
          "#edit-field-overall-vb3-ex-3-0-value",
          "#edit-field-overall-vb3-ex-4-0-value",
          "#edit-field-overall-vb3-ex-5-0-value",
          "#edit-field-overall-vb3-ex-6-0-value",
          "#edit-field-overall-vb3-ex-7-a-0-value",
          "#edit-field-overall-vb3-ex-7-b-0-value",
          "#edit-field-overall-vb3-ex-7-c-0-value",
          "#edit-field-overall-vb3-ex-7-d-0-value",
          "#edit-field-overall-vb3-ex-7-e-0-value",
          "#edit-field-overall-vb3-ex-7-f-0-value",
          "#edit-field-overall-vb3-ex-8-0-value",
          "#edit-field-overall-vb3-ex-9-0-value"
        ],
        messages: {
          lessThanEqualSum: "This field should be no more than the sum of the fields Overall V.B.(3) Ex.1 through V.B.(3) Ex.9."
        }
      });

      // V.B.(1) Agency Overall Other*
      $( "#edit-field-overall-vb1-oth-0-value").rules( "add", {
        equalTo: "#edit-field-overall-vb2-total-0-value",
        messages: {
          equalTo: "Must match V.B.(2) Agency Overall Total"
        }
      });

      // V.B.(1) Agency Overall Total
      $( "#edit-field-overall-vb1-total-0-value").rules( "add", {
        required: true,
        equalTo: "#edit-field-overall-req-processed-yr-0-value",
        messages: {
          equalTo: "Must match V.A. Agency Overall Number of Requests Processed in Fiscal Year"
        }
      });

      // V.B.(1) Agency Component Other*
      $( "input[name*='field_foia_requests_vb1']").filter("input[name*='field_oth']").each(function () {
          $(this).rules( "add", {
              equalToComp: $("input[name*='field_foia_requests_vb2']").filter("input[name*='field_total']"),
              messages: {
                  equalToComp: "Must match V.A. Agency Number of Requests Processed in Fiscal Year"
              }
          });
      });

      // V.B.(1) Agency Number of Full Denials Based on Exemptions
        $( "input[name*='field_foia_requests_vb1']").filter("input[name*='field_full_denials_ex']").each(function () {
          $(this).rules( "add", {
            lessThanEqualSumComp: [
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_1']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_2']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_3']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_4']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_5']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_6']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_7_a']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_7_b']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_7_c']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_7_d']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_7_e']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_7_f']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_8']"),
              $("input[name*='field_foia_requests_vb3']").filter("input[name*='field_ex_9']"),
            ],
          messages: {
              lessThanEqualSumComp: "This field should be no more than the sum of the fields V.B.(3) Ex.1 through V.B.(3) Ex.9. for the corresponding agency."
          }
        })
      });

      // V.B. (2) (Component) Number of Times "Other" Reason Was Relied Upon
      $( "#edit-field-foia-requests-vb2-0-subform-field-foia-req-vb2-info-0-subform-field-num-relied-upon-0-value").rules( "add", {
        notNegative: true,
        messages: {
          notNegative: "Must be a zero or a positive number."
        }
      });


      // VI.A. Agency Overall Number of Appeals Processed in Fiscal Year
      $( "#edit-field-overall-via-app-proc-yr-0-value").rules( "add", {
        equalTo: "#edit-field-overall-vib-total-0-value",
        messages: {
          equalTo: "Must match VI.B. Agency Overall Total"
        }
      });

      // VI.A. Administrative Appeals Processed During Fiscal Year from Current Annual Report
      $( "input[name*='field_admin_app_via']").filter("input[name*='field_app_processed_yr']").each(function () {
        $(this).rules( "add", {
          equalToComp: $( "input[name*='field_admin_app_vib']").filter("input[name*='field_total']"),
          messages: {
            equalToComp: "Must match VI.B. Total Processed Appeals in Fiscal Year for corresponding agency/component"
          }
        });
      });

      // VI.A. Agency Overall Number of Appeals Processed in Fiscal Year
      $( "input[name*='field_admin_app_via']").filter("input[name*='field_app_pend_end_yr']").each(function () {
        $(this).rules( "add", {
          greaterThanZeroSumComp: [
            $("input[name*='field_admin_app_vic5']").filter("input[name*='field_num_days_1']"),
            $("input[name*='field_admin_app_vic5']").filter("input[name*='field_num_days_2']"),
            $("input[name*='field_admin_app_vic5']").filter("input[name*='field_num_days_3']"),
            $("input[name*='field_admin_app_vic5']").filter("input[name*='field_num_days_4']"),
            $("input[name*='field_admin_app_vic5']").filter("input[name*='field_num_days_5']"),
            $("input[name*='field_admin_app_vic5']").filter("input[name*='field_num_days_6']"),
            $("input[name*='field_admin_app_vic5']").filter("input[name*='field_num_days_7']"),
            $("input[name*='field_admin_app_vic5']").filter("input[name*='field_num_days_8']"),
            $("input[name*='field_admin_app_vic5']").filter("input[name*='field_num_days_9']"),
            $("input[name*='field_admin_app_vic5']").filter("input[name*='field_num_days_10']"),
          ],
          messages: {
            greaterThanZeroSumComp: "Must match VI.C.5. must have values > 0."
          }
        });
      });

      // VI.B. Administrative Appeals
      $( "input[name*='field_admin_app_vib']").filter("input[name*='field_closed_oth_app']").each(function () {
        $(this).rules( "add", {
          lessThanEqualComp: $("input[name*='field_admin_app_vic2']").filter("input[name*='field_oth']"),
          messages: {
            lessThanEqualComp: "Must be less than or equal to the total # of reasons for denial in VI.C.(2)"
          }
        });
      });

      // VI.C.(3). Agency Overall Total
      $( "#edit-field-overall-vic3-total-0-value").rules( "add", {
        equalTo: "#edit-field-overall-vic2-oth-0-value",
        messages: {
          equalTo: "Must match VI.C.(2) \"Agency Overall Other\""
        }
      });

      // VI.B. DISPOSITION OF ADMINISTRATIVE APPEALS -- ALL PROCESSED APPEALS
      $( "#edit-field-overall-vib-closed-oth-app-0-value").rules( "add", {
        lessThanEqualSum: [
          "#edit-field-overall-vic2-no-rec-0-value",
          "#edit-field-overall-vic2-rec-refer-ini-0-value",
          "#edit-field-overall-vic2-req-withdrawn-0-value",
          "#edit-field-overall-vic2-fee-rel-reas-0-value",
          "#edit-field-overall-vic2-rec-not-desc-0-value",
          "#edit-field-overall-vic2-imp-req-oth-0-value",
          "#edit-field-overall-vic2-not-agency-re-0-value",
          "#edit-field-overall-vic2-dup-req-0-value",
          "#edit-field-overall-vic2-req-in-lit-0-value",
          "#edit-field-overall-vic2-app-denial-ex-0-value",
          "#edit-field-overall-vic2-oth-0-value"
        ],
        messages: {
          lessThanEqualSum: "This field should be no more than the sum of the fields in VI.C.(2)."
        }
      });

      // VI.C.2 Reasons for Denial on Appeal -- "Other" Reasons
      $( "input[name*='field_admin_app_vic2']").filter("input[name*='field_oth']").each(function () {
        $(this).rules( "add", {
          equalToComp: $( "input[name*='field_admin_app_vic3']").filter("input[name*='field_total']"),
          messages: {
            equalToComp: "Must match VI.B. Total Processed Appeals in Fiscal Year for corresponding agency/component"
          }
        });
      });

      // VI.C.(4) - Administrative Appeals
      $( "input[name*='field_admin_app_vic4']").filter("input[name*='field_low_num_days']").rules( "add", {
        lessThanEqualComp: $( "input[name*='field_admin_app_vic4']").filter("input[name*='field_high_num_days']"),
        greaterThanZeroOrNA: true,
        messages: {
          lessThanEqualComp: "Must be lower than or equal to the highest number of days."
        }
      });

      // VI.C.(4) - Agency Overall Median Number of Days
      $( "#edit-field-overall-vic4-med-num-days-0-value").rules( "add", {
        betweenMinMaxCompNA: $("input[name*='field_admin_app_vic4']").filter("input[name*='field_med_num_days']"),
        messages: {
          betweenMinMaxCompNA: "This field should be between the largest and smallest values of Median Number of Days"
        }
      });

      // VI.C.(5). TEN OLDEST PENDING ADMINISTRATIVE APPEALS / 2nd - 10th
      // Iterate over 2nd to 10th oldest overall pending appeals, comparing
      // the value to the one before it, e.g. value of 9th <= 8th.
      for (var i = 2; i <= 10; i++){
        var prior = oldestOrdinal(i - 1),
            inputId = "#edit-field-overall-vic5-num-day-" + i + "-0-value",
            comparisonId = "#edit-field-overall-vic5-num-day-" + (i - 1) + "-0-value";
        $(inputId).rules( "add", {
          lessThanEqualTo: $(comparisonId),
          messages: {
            lessThanEqualTo: "This should be less than or equal to the number of days for <em>" + prior + "</em>."
          }
        });
      }

      // VI.C. (5) - ADMINISTRATIVE APPEALS - Oldest Days component/ 2nd-10th
      // For each Agency/Component, iterate over 2nd to 10th Oldest days
      // comparing the value to the one before it, e.g. value of 9th <= 8th.
      for (var i = 2; i <= 10; i++){
        var priorOrdinal = oldestOrdinal(i - 1);
        $("input[name*='field_admin_app_vic5']").filter("input[name*='field_num_days_" + i + "']").each(function () {
          $(this).rules( "add", {
            lessThanEqualOlderComp: 'field_num_days_' + String(i-1),
            messages: {
              lessThanEqualOlderComp: "This should be less than or equal to the number of days for <em>" + priorOrdinal + "</em>."
            }
          });
        });
      }

      // VII.A. Simple - Agency Overall Median Number of Days
      $( "#edit-field-overall-viia-sim-med-0-value").rules( "add", {
        betweenMinMaxCompNA: $("input[name*='field_proc_req_viia']").filter("input[name*='field_sim_med']"),
        messages: {
          betweenMinMaxCompNA: "This field should be between the largest and smallest values of Median Number of Days"
        }
      });

      // VII.A. Simple - Agency Component Lowest Number of Days
      $('input[name^="field_proc_req_viia"]').filter("input[name*='subform']").filter("input[name*='field_sim_low']").each(function (index) {
        var comparison_input = $(this).attr('name').replace('field_sim_low', 'field_sim_high');
        $(this).rules("add", {
          lessThanEqualTo: $('input[name="' + comparison_input + '"]'),
          messages: {
            lessThanEqualTo: "This should be less than or equal to the number of days for Highest Number of Days.",
          }
        });

        // Revalidate the lowest days value when the highest days value changes.
        var that = this;
        $('input[name="' + comparison_input + '"]').once('VIIASimHighValidate').keyup(function (event) {
          revalidateOnKeyup(event, that);
        })
      });

      // VII.A. Complex - Agency Overall Median Number of Days
      $( "#edit-field-overall-viia-comp-med-0-value").rules( "add", {
        betweenMinMaxCompNA: $("input[name*='field_proc_req_viia']").filter("input[name*='field_comp_med']"),
        messages: {
          betweenMinMaxCompNA: "This field should be between the largest and smallest values of Median Number of Days"
        }
      });

      // VII.A. Complex - Agency Component Lowest Number of Days
      $('input[name^="field_proc_req_viia"]').filter("input[name*='subform']").filter("input[name*='field_comp_low']").each(function (index) {
        var comparison_input = $(this).attr('name').replace('field_comp_low', 'field_comp_high');
        $(this).rules("add", {
          lessThanEqualTo: $('input[name="' + comparison_input + '"]'),
          messages: {
            lessThanEqualTo: "This should be less than or equal to the number of days for Highest Number of Days.",
          }
        });

        // Revalidate the lowest days value when the highest days value changes.
        var that = this;
        $('input[name="' + comparison_input + '"]').once('VIIACompHighValidate').keyup(function (event) {
          revalidateOnKeyup(event, that);
        })
      });

      // VII.A. Expedited Processing - Agency Overall Median Number of Days
      $( "#edit-field-overall-viia-exp-med-0-value").rules( "add", {
        betweenMinMaxCompNA: $("input[name*='field_proc_req_viia']").filter("input[name*='field_exp_med']"),
        messages: {
          betweenMinMaxCompNA: "This field should be between the largest and smallest values of Median Number of Days"
        }
      });

      // VII.A. Expedited Processing - Agency Component Lowest Number of Days
      $('input[name^="field_proc_req_viia"]').filter("input[name*='subform']").filter("input[name*='field_exp_low']").each(function (index) {
        var comparison_input = $(this).attr('name').replace('field_exp_low', 'field_exp_high');
        $(this).rules("add", {
          lessThanEqualTo: $('input[name="' + comparison_input + '"]'),
          messages: {
            lessThanEqualTo: "This should be less than or equal to the number of days for Highest Number of Days.",
          }
        });

        // Revalidate the lowest days value when the highest days value changes.
        var that = this;
        $('input[name="' + comparison_input + '"]').once('VIIAExpHighValidate').keyup(function (event) {
          revalidateOnKeyup(event, that);
        })
      });

      // VII.B. Simple - Agency Overall Median Number of Days
      $( "#edit-field-overall-viib-sim-med-0-value").rules( "add", {
        betweenMinMaxCompNA: $("input[name*='field_proc_req_viib']").filter("input[name*='field_sim_med']"),
        messages: {
          betweenMinMaxCompNA: "This field should be between the largest and smallest values of Median Number of Days"
        }
      });

      // VII.B. Simple - Agency Component Lowest Number of Days
      $('input[name^="field_proc_req_viib"]').filter("input[name*='subform']").filter("input[name*='field_sim_low']").each(function (index) {
        var comparison_input = $(this).attr('name').replace('field_sim_low', 'field_sim_high');
        $(this).rules("add", {
          lessThanEqualTo: $('input[name="' + comparison_input + '"]'),
          messages: {
            lessThanEqualTo: "This should be less than or equal to the number of days for Highest Number of Days.",
          }
        });

        // Revalidate the lowest days value when the highest days value changes.
        var that = this;
        $('input[name="' + comparison_input + '"]').once('VIIBSimHighValidate').keyup(function (event) {
          revalidateOnKeyup(event, that);
        })
      });

      // VII.B. Complex - Agency Overall Median Number of Days
      $( "#edit-field-overall-viib-comp-med-0-value").rules( "add", {
        betweenMinMaxCompNA: $("input[name*='field_proc_req_viib']").filter("input[name*='field_comp_med']"),
        messages: {
          betweenMinMaxCompNA: "This field should be between the largest and smallest values of Median Number of Days"
        }
      });

      // VII.B. Complex - Agency Component Lowest Number of Days
      $('input[name^="field_proc_req_viib"]').filter("input[name*='subform']").filter("input[name*='field_comp_low']").each(function (index) {
        var comparison_input = $(this).attr('name').replace('field_comp_low', 'field_comp_high');
        $(this).rules("add", {
          lessThanEqualTo: $('input[name="' + comparison_input + '"]'),
          messages: {
            lessThanEqualTo: "This should be less than or equal to the number of days for Highest Number of Days.",
          }
        });

        // Revalidate the lowest days value when the highest days value changes.
        var that = this;
        $('input[name="' + comparison_input + '"]').once('VIIBCompHighValidate').keyup(function (event) {
          revalidateOnKeyup(event, that);
        })
      });

      // VII.B. Expedited Processing - Agency Overall Median Number of Days
      $( "#edit-field-overall-viib-exp-med-0-value").rules( "add", {
        betweenMinMaxCompNA: $("input[name*='field_proc_req_viib']").filter("input[name*='field_exp_med']"),
        messages: {
          betweenMinMaxCompNA: "This field should be between the largest and smallest values of Median Number of Days"
        }
      });

      // VII.B. Expedited Processing - Agency Component Lowest Number of Days
      $('input[name^="field_proc_req_viib"]').filter("input[name*='subform']").filter("input[name*='field_exp_low']").each(function (index) {
        var comparison_input = $(this).attr('name').replace('field_exp_low', 'field_exp_high');
        $(this).rules("add", {
          lessThanEqualTo: $('input[name="' + comparison_input + '"]'),
          messages: {
            lessThanEqualTo: "This should be less than or equal to the number of days for Highest Number of Days.",
          }
        });

        // Revalidate the lowest days value when the highest days value changes.
        var that = this;
        $('input[name="' + comparison_input + '"]').once('VIIBExpHighValidate').keyup(function (event) {
          revalidateOnKeyup(event, that);
        })
      });

      // VII.D. Sum of requests in simple, complex, and expedited must be equal
      // to or less than number of requests pending at end of FY from V.A
      $("input[name*='field_pending_requests_vii_d_']").filter("input[name*='field_sim_pend'], input[name*='field_comp_pend'], input[name*='field_exp_pend']").each(function () {
        $(this).rules( "add", {
          multiLessThanEqualSumComp: {
            multiFields: ['field_sim_pend', 'field_comp_pend', 'field_exp_pend'],
            target: $("input[name*='field_foia_requests_va']").filter("input[name*='field_req_pend_end_yr']"),
          },
          messages: {
            multiLessThanEqualSumComp: "Number pending for simple, complex, and expedited should be less than or equal to number of requests pending at end of FY from V.A."
          }
        });
      });

      // VII.D. Simple - Number Pending
      $( "#edit-field-overall-viid-sim-pend-0-value").rules( "add", {
        equalSumComp: $("input[name*='field_pending_requests_vii_d_']").filter("input[name*='field_sim_pend']"),
        messages: {
          equalSumComp: "Must equal sum of Number Pending."
        }
      });

      // VII.D. Simple - Agency Overall Median Number of Days
      $( "#edit-field-overall-viid-sim-med-0-value").rules( "add", {
        betweenMinMaxCompNA: $("input[name*='field_pending_requests_vii_d_']").filter("input[name*='field_sim_med']"),
        messages: {
          betweenMinMaxCompNA: "This field should be between the largest and smallest values of Median Number of Days"
        }
      });

      // VII.D. Complex - Number Pending
      $( "#edit-field-overall-viid-comp-pend-0-value").rules( "add", {
        equalSumComp: $("input[name*='field_pending_requests_vii_d_']").filter("input[name*='field_comp_pend']"),
        messages: {
          equalSumComp: "Must equal sum of Number Pending."
        }
      });

      // VII.D. Complex - Agency Overall Median Number of Days
      $( "#edit-field-overall-viid-comp-med-0-value").rules( "add", {
        betweenMinMaxCompNA: $("input[name*='field_pending_requests_vii_d_']").filter("input[name*='field_comp_med']"),
        messages: {
          betweenMinMaxCompNA: "This field should be between the largest and smallest values of Median Number of Days"
        }
      });

      // VII.D. Expedited Processing - Number Pending
      $( "#edit-field-overall-viid-exp-pend-0-value").rules( "add", {
        equalSumComp: $("input[name*='field_pending_requests_vii_d_']").filter("input[name*='field_exp_pend']"),
        messages: {
          equalSumComp: "Must equal sum of Number Pending."
        }
      });

      // VII.D. Expedited - Agency Overall Median Number of Days
      $( "#edit-field-overall-viid-exp-med-0-value").rules( "add", {
        betweenMinMaxCompNA: $("input[name*='field_pending_requests_vii_d_']").filter("input[name*='field_exp_med']"),
        messages: {
          betweenMinMaxCompNA: "This field should be between the largest and smallest values of Median Number of Days"
        }
      });

      // VII.E. PENDING REQUESTS / 2nd - 10th
      // Iterate over the the 2nd to 10th oldest overall pending requests,
      // comparing the value to the one before it, e.g. value of 9th <= 8th.
      for (var i = 2; i <= 10; i++){
        var prior = oldestOrdinal(i - 1),
            inputId = "#edit-field-overall-viie-num-days-" + i + "-0-value",
            comparisonId = "#edit-field-overall-viie-num-days-" + (i - 1) + "-0-value";
        $(inputId).rules( "add", {
          lessThanEqualTo: $(comparisonId),
          messages: {
            lessThanEqualTo: "This should be less than or equal to the number of days for <em>" + prior + "</em>."
          }
        });
      }

      // VII.E. PENDING REQUESTS - Oldest Days component/ 2nd-10th
      // For each Agency/Component, iterate over 2nd to 10th Oldest days
      // comparing the value to the one before it, e.g. value of 9th <= 8th.
      for (var i = 2; i <= 10; i++){
        priorOrdinal = oldestOrdinal(i - 1);
        $("input[name*='field_admin_app_viie']").filter("input[name*='field_num_days_" + i + "']").each(function () {
          $(this).rules( "add", {
            lessThanEqualOlderComp: 'field_num_days_' + String(i-1),
            messages: {
              lessThanEqualOlderComp: "This should be less than or equal to the number of days for <em>" + priorOrdinal + "</em>."
            }
          });
        });
      }

      // VIII.A. Agency Overall Median Number of Days to Adjudicate
      $( "#edit-field-overall-viiia-med-days-jud-0-value").rules( "add", {
        betweenMinMaxCompNA: $("input[name*='field_req_viiia']").filter("input[name*='field_med_days_jud']"),
        messages: {
          betweenMinMaxCompNA: "This field should be between the largest and smallest values of Median Number of Days"
        }
      });

      // VIII.A. Agency Overall Number Adjudicated Within Ten Calendar Days
      $( "#edit-field-overall-viiia-num-jud-w10-0-value").rules( "add", {
        lessThanEqualSum: [
          "#edit-field-overall-viiia-num-grant-0-value",
          "#edit-field-overall-viiia-num-denied-0-value"
        ],
        messages: {
          lessThanEqualSum: "This field should be should be equal to or less than the # granted + # denied.",
        }
      });

      // VIII.B. Agency Overall Median Number of Days to Adjudicate
      $( "#edit-field-overall-viiib-med-days-jud-0-value").rules( "add", {
        betweenMinMaxCompNA: $("input[name*='field_req_viiib']").filter("input[name*='field_med_days_jud']"),
        messages: {
          betweenMinMaxCompNA: "This field should be between the largest and smallest values of Median Number of Days"
        }
      });

      // IX. Total Number of "Full-Time FOIA Staff"
      $("input[name*='field_foia_pers_costs_ix']").filter("input[name*='field_total_staff']").each(function () {
        $(this).rules( "add", {
          ifGreaterThanZeroComp: $("input[name*='field_foia_requests_vb1']").filter("input[name*='field_total']"),
          messages: {
            ifGreaterThanZeroComp: "If requests were processed in V.B.(1), the total number of full-time FOIA staff must be greater than 0",
          }
        });
      });

      // IX. Agency Overall Total Number of "Full-Time FOIA Staff"
      // IX. Agency Overall Processing Costs
      $( "#edit-field-overall-ix-total-staff-0-value, #edit-field-overall-ix-total-costs-0-value").each(function () {
        $(this).rules( "add", {
          greaterThanZero: {
            depends: function () {
              return Number($("#edit-field-overall-vb1-total-0-value").val()) > 0;
            }
          },
          messages: {
            greaterThanZero: "Should be greater than zero, if requests were processed in V.B.(1).",
          }
        });
      });

      // XII.A. Number of Backlogged Requests as of End of Fiscal Year
      $( "input[name*='field_foia_xiia']").filter("input[name*='field_back_req_end_yr']").each(function () {
        $(this).rules( "add", {
          lessThanEqualSumComp: [
            $("input[name*='field_pending_requests_vii_d_']").filter("input[name*='field_sim_pend']"),
            $("input[name*='field_pending_requests_vii_d_']").filter("input[name*='field_comp_pend']"),
            $("input[name*='field_pending_requests_vii_d_']").filter("input[name*='field_exp_pend']"),
          ],
          messages: {
            lessThanEqualSumComp: "Must be equal to or less than the corresponding sum total of Simple, Complex, and Expedited pending requests from VII.D."
          }
        });
      });

      // XII.A. Number of Backlogged Appeals as of End of Fiscal Year
      $( "input[name*='field_foia_xiia']").filter("input[name*='field_back_app_end_yr']").each(function () {
        $(this).rules( "add", {
          lessThanEqualComp: $("input[name*='field_admin_app_via']").filter("input[name*='field_app_pend_end_yr']"),
          messages: {
            lessThanEqualComp: "Must be equal to or less than VI.A.(1). corresponding Number of Appeals Pending as of End of Fiscal Year"
          }
        });
      });

      // XII.A. Agency Overall Number of Backlogged Requests as of End of Fiscal Year
      $( "#edit-field-overall-xiia-back-req-end-0-value").rules( "add", {
        lessThanEqualSum: [
          "#edit-field-overall-viid-sim-pend-0-value",
          "#edit-field-overall-viid-comp-pend-0-value",
          "#edit-field-overall-viid-exp-pend-0-value",
        ],
        messages: {
          lessThanEqualSum: "Must be equal to or less than the sum total of overall Simple, Complex, and Expedited pending requests from VII.D."
        }
      });

      // XII.A. Agency Overall Number of Backlogged Appeals as of End of Fiscal Year
      $( "#edit-field-overall-xiia-back-app-end-0-value").rules( "add", {
        lessThanEqualTo: "#edit-field-overall-via-app-pend-endyr-0-value",
        messages: {
          lessThanEqualTo: "Must be equal to or less than VI.A.(1). Agency Overall Number of Appeals Pending as of End of Fiscal Year",
        }
      });

      // XII.C. FOIA Requests and Administrative Appeals
      $("input[name*='field_foia_xiic']").filter("input[name*='[field_num_days_1]']").each(function() {
        $(this).rules( "add", {
          ifGreaterThanZeroComp: $("input[name*='field_foia_xiib']").filter("input[name*='field_pend_end_yr']"),
          messages: {
            ifGreaterThanZeroComp: "If there are consultations pending at end of year for XII.B, there must be entries in this section for that component.",
          }
        });
      });

      // XII.C. CONSULTATIONS ON FOIA REQUESTS -- TEN OLDEST CONSULTATIONS RECEIVED FROM OTHER AGENCIES AND PENDING AT THE AGENCY
      // 2nd - 10th
      // Iterate over the the 2nd to 10th overall oldest consultations
      // received, comparing the value to the one before it,
      // e.g. value of 9th <= 8th.
      for (var i = 2; i <= 10; i++){
        var prior = oldestOrdinal(i - 1),
            inputId = "#edit-field-overall-xiic-num-days-" + i + "-0-value",
            comparisonId = "#edit-field-overall-xiic-num-days-" + (i - 1) + "-0-value";
        $(inputId).rules( "add", {
            lessThanEqualTo: $(comparisonId),
            messages: {
              lessThanEqualTo: "This should be less than or equal to the number of days for <em>" + prior + "</em>."
            }
          });
      }

      // XII.C. FOIA Requests and Administrative Appeals - Oldest Days component/ 2nd-10th
      // For each Agency/Component, iterate over 2nd to 10th Oldest days
      // comparing the value to the one before it, e.g. value of 9th <= 8th.
      for (var i = 2; i <= 10; i++){
        priorOrdinal = oldestOrdinal(i - 1);
        $("input[name*='field_foia_xiic']").filter("input[name*='field_num_days_" + i + "']").each(function () {
          $(this).rules( "add", {
            lessThanEqualOlderComp: 'field_num_days_' + String(i-1),
            messages: {
              lessThanEqualOlderComp: "This should be less than or equal to the number of days for <em>" + priorOrdinal + "</em>."
            }
          });
        });
      }

      // XII.D.(1). Number Received During Fiscal Year from Current Annual Report
      $( "input[name*='field_foia_xiid1']").filter("input[name*='field_received_cur_yr']").each(function () {
        $(this).rules( "add", {
          equalToComp: $( "input[name*='field_foia_requests_va']").filter("input[name*='field_req_received_yr']"),
          messages: {
            equalToComp: "Must match V.A. Number of Requests Received in Fiscal Year for corresponding agency/component"
          }
        });
      });

      // XII.D.(1). Number Processed During Fiscal Year from Current Annual Report
      $( "input[name*='field_foia_xiid1']").filter("input[name*='field_proc_cur_yr']").each(function () {
        $(this).rules( "add", {
          equalToComp: $( "input[name*='field_foia_requests_va']").filter("input[name*='field_req_processed_yr']"),
          messages: {
            equalToComp: "Must match V.A. Number of Requests Processed in Fiscal Year for corresponding agency/component"
          }
        });
      });

      // XII.D.(1). Agency Overall Number Received During Fiscal Year from Current Annual Report
      $( "#edit-field-overall-xiid1-received-cur-0-value").rules( "add", {
        equalTo: "#edit-field-overall-req-received-yr-0-value",
        messages: {
          equalTo: "Must match V.A. Agency Overall Number of Requests Received in Fiscal Year",
        }
      });

      // XII.D.(1). Agency Overall Number Processed During Fiscal Year from Current Annual Report
      $( "#edit-field-overall-xiid1-proc-cur-yr-0-value").rules( "add", {
        equalTo: "#edit-field-overall-req-processed-yr-0-value",
        messages: {
          equalTo: "Must match V.A. Agency Overall Number of Requests Processed in Fiscal Year",
        }
      });

      // XII.D.(2). Number of Backlogged Requests as of End of the Fiscal Year from Current Annual Report
      $( "input[name*='field_foia_xiid2']").filter("input[name*='field_back_cur_yr']").each(function () {
        $(this).rules( "add", {
          equalToComp: $( "input[name*='field_foia_xiia']").filter("input[name*='field_back_req_end_yr']"),
          messages: {
            equalToComp: "Must match XII.A. Number of Backlogged Requests as of End of Fiscal Year",
          }
        });
      });

      // XII.D.(2). Agency Overall Number of Backlogged Requests as of End of the Fiscal Year from Current Annual Report
      $( "#edit-field-overall-xiid2-back-cur-yr-0-value").rules( "add", {
        equalTo: "#edit-field-overall-xiia-back-req-end-0-value",
        messages: {
          equalTo: "Must match XII.A. Agency Overall Number of Backlogged Requests as of End of Fiscal Year",
        }
      });

      // XII.E.(1). Number Received During Fiscal Year from Current Annual Report
      $( "input[name*='field_foia_xiie1']").filter("input[name*='field_received_cur_yr']").each(function () {
        $(this).rules( "add", {
          equalToComp: $( "input[name*='field_admin_app_via']").filter("input[name*='field_app_received_yr']"),
          messages: {
            equalToComp: "Must match VI.A. Number of Appeals Received in Fiscal Year for corresponding agency/component"
          }
        });
      });

      // XII.E.(1). Number Processed During Fiscal Year from Current Annual Report
      $( "input[name*='field_foia_xiie1']").filter("input[name*='field_proc_cur_yr']").each(function () {
        $(this).rules( "add", {
          equalToComp: $( "input[name*='field_admin_app_via']").filter("input[name*='field_app_processed_yr']"),
          messages: {
            equalToComp: "Must match VI.A. Number of Appeals Processed in Fiscal Year for corresponding agency/component"
          }
        });
      });

      // XII.E.(1). Agency Overall Number Received During Fiscal Year from Current Annual Report
      $( "#edit-field-overall-xiie1-received-cur-0-value").rules( "add", {
        equalTo: "#edit-field-overall-via-app-recd-yr-0-value",
        messages: {
          equalTo: "Must match VI.A. Agency Overall Number of Appeals Received in Fiscal Year",
        }
      });

      // XII.E.(1). Agency Overall Number Processed During Fiscal Year from Current Annual Report
      $( "#edit-field-overall-xiie1-proc-cur-yr-0-value").rules( "add", {
        equalTo: "#edit-field-overall-via-app-proc-yr-0-value",
        messages: {
          equalTo: "Must match VI.A. Agency Overall Number of Appeals Processed in Fiscal Year",
        }
      });

      // XII.E.(2). Number Processed During Fiscal Year from Current Annual Report
      $( "input[name*='field_foia_xiie2']").filter("input[name*='field_back_cur_yr']").each(function () {
        $(this).rules( "add", {
          equalToComp: $( "input[name*='field_foia_xiia']").filter("input[name*='field_back_app_end_yr']"),
          messages: {
            equalToComp: "Must match XII.A. Number of Backlogged Appeals as of End of Fiscal Year for corresponding agency/component"
          }
        });
      });

      // XII.E.(2). Agency Overall Number of Backlogged Appeals as of End of the Fiscal Year from Current Annual Report
      $( "#edit-field-overall-xiie2-back-cur-yr-0-value").rules( "add", {
        equalTo: "#edit-field-overall-xiia-back-app-end-0-value",
        messages: {
          equalTo: "Must match XII.A. Agency Overall Number of Backlogged Appeals as of End of Fiscal Year",
        }
      });
    }
  };

})(jQuery, drupalSettings, Drupal);
