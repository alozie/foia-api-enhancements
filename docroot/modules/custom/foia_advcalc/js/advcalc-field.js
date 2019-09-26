(function ($, drupalSettings, Drupal) {
  Drupal.behaviors.advcalc_field = {
      attach: function attach() {

          // Fields from sections IX and X to calculate overall_x_perc_costs.
          $("#edit-field-overall-ix-proc-costs-0-value, #edit-field-overall-x-total-fees-0-value").change(function() {
              var overall_ix_proc_costs = Number($("#edit-field-overall-ix-proc-costs-0-value").val());
              if ( overall_ix_proc_costs > 0 ) {
                  var overall_x_total_fees = Number($("#edit-field-overall-x-total-fees-0-value").val());
                  var overall_x_perc_costs = overall_x_total_fees / overall_ix_proc_costs;
                  var overall_x_perc_costs = Math.round(overall_x_perc_costs * 10000) / 10000; // Round to 4 decimal places
                  $('#edit-field-overall-x-perc-costs-0-value').val(overall_x_perc_costs);
              }
          });

          // Fields from section VI A to calculate app_pend_start_yr.
          var via = $('input[id^="edit-field-admin-app-via"]');
          via.change(function() {
            var via_count = $("table[id^='field-admin-app-via-values'] tbody" +
              " tr");
            var via_vals = [];

            for (var i = 0; i < via_count.length; i++) {
              var edit_pend_start_name = "[data-drupal-selector='edit-field-admin-app-via-" + i + "-subform-field-app-pend-start-yr-0-value'";
              var edit_rec_name = "[data-drupal-selector='edit-field-admin-app-via-" + i + "-subform-field-app-received-yr-0-value'";
              var edit_proc_name = "[data-drupal-selector='edit-field-admin-app-via-" + i + "-subform-field-app-processed-yr-0-value'";
              var edit_pend_end_name = "[data-drupal-selector='edit-field-admin-app-via-" + i + "-subform-field-app-pend-end-yr-0-value'";
              via_vals[i] = {
                appPendStartYr: Number($(edit_pend_start_name).val()),
                appReceivedYr: Number($(edit_rec_name).val()),
                appProcessedYr: Number($(edit_proc_name).val()),
                appPendEndYr: function() {
                  return this.appPendStartYr + this.appReceivedYr - this.appProcessedYr;
                }
              };
              $(edit_pend_end_name).val(via_vals[i].appPendEndYr());
            }

            $("#edit-field-overall-via-app-pend-start-0-value, #edit-field-overall-via-app-recd-yr-0-value, #edit-field-overall-via-app-proc-yr-0-value").change(function() {
              var overall_app_pend_start_yr = Number($("#edit-field-overall-via-app-pend-start-0-value").val());
              var overall_app_received_yr = Number($("#edit-field-overall-via-app-recd-yr-0-value").val());
              var overall_app_processed_yr = Number($("#edit-field-overall-via-app-proc-yr-0-value").val());
              var overall_app_pend_end_yr = overall_app_pend_start_yr + overall_app_received_yr - overall_app_processed_yr;
              $('#edit-field-overall-via-app-pend-endyr-0-value').val(overall_app_pend_end_yr);
            });

          });

          // Section V A automatically calculate field_req_pend_end_yr.
          // req_pend_start_yr + req_received_yr - req_processed_yr = req_pend_end_yr
          var via = $('input[id^="edit-field-foia-requests-va"]');
          via.change(function() {
              var va_count = $("table[id^='field-foia-requests-va-values'] tbody" +
                  " tr");
              var va_vals = [];

              for (var i = 0; i < va_count.length; i++) {
                  var edit_pend_start_name = "[data-drupal-selector='edit-field-foia-requests-va-" + i + "-subform-field-req-pend-start-yr-0-value'";
                  var edit_rec_name = "[data-drupal-selector='edit-field-foia-requests-va-" + i + "-subform-field-req-received-yr-0-value'";
                  var edit_proc_name = "[data-drupal-selector='edit-field-foia-requests-va-" + i + "-subform-field-req-processed-yr-0-value'";
                  var edit_pend_end_name = "[data-drupal-selector='edit-field-foia-requests-va-" + i + "-subform-field-req-pend-end-yr-0-value'";
                  va_vals[i] = {
                      appPendStartYr: Number($(edit_pend_start_name).val()),
                      appReceivedYr: Number($(edit_rec_name).val()),
                      appProcessedYr: Number($(edit_proc_name).val()),
                      appPendEndYr: function() {
                          return this.appPendStartYr + this.appReceivedYr - this.appProcessedYr;
                      }
                  };
                  $(edit_pend_end_name).val(va_vals[i].appPendEndYr());
              }

              $("#edit-field-overall-req-pend-start-yr-0-value, #edit-field-overall-req-received-yr-0-value, #edit-field-overall-req-processed-yr-0-value").change(function() {
                  var overall_app_pend_start_yr = Number($("#edit-field-overall-req-pend-start-yr-0-value").val());
                  var overall_app_received_yr = Number($("#edit-field-overall-req-received-yr-0-value").val());
                  var overall_app_processed_yr = Number($("#edit-field-overall-req-processed-yr-0-value").val());
                  var overall_app_pend_end_yr = overall_app_pend_start_yr + overall_app_received_yr - overall_app_processed_yr;
                  $('#edit-field-overall-req-pend-end-yr-0-value').val(overall_app_pend_end_yr);
              });

          });

          // Section XII B automatically calculate field_pend_end_yr.
          // pend_start_yr + con_during_yr - proc_start_yr = pend_end_yr
          var xiib = $('input[id^="edit-field-foia-xiib"]');
          xiib.change(function() {
              var xiib_count = $("table[id^='field-foia-xiib-values'] tbody" +
                  " tr");
              var xiib_vals = [];

              for (var i = 0; i < xiib_count.length; i++) {
                  var edit_pend_start_name = "[data-drupal-selector='edit-field-foia-xiib-" + i + "-subform-field-pend-start-yr-0-value'";
                  var edit_rec_name = "[data-drupal-selector='edit-field-foia-xiib-" + i + "-subform-field-con-during-yr-0-value'";
                  var edit_proc_name = "[data-drupal-selector='edit-field-foia-xiib-" + i + "-subform-field-proc-start-yr-0-value'";
                  var edit_pend_end_name = "[data-drupal-selector='edit-field-foia-xiib-" + i + "-subform-field-pend-end-yr-0-value'";
                  xiib_vals[i] = {
                      appPendStartYr: Number($(edit_pend_start_name).val()),
                      appReceivedYr: Number($(edit_rec_name).val()),
                      appProcessedYr: Number($(edit_proc_name).val()),
                      appPendEndYr: function() {
                          return this.appPendStartYr + this.appReceivedYr - this.appProcessedYr;
                      }
                  };
                  $(edit_pend_end_name).val(xiib_vals[i].appPendEndYr());
              }

              $("#edit-field-overall-xiib-pend-start-yr-0-value, #edit-field-overall-xiib-con-during-yr-0-value, #edit-field-overall-xiib-proc-start-yr-0-value").change(function() {
                  var overall_pend_start_yr = Number($("#edit-field-overall-xiib-pend-start-yr-0-value").val());
                  var overall_con_during_yr = Number($("#edit-field-overall-xiib-con-during-yr-0-value").val());
                  var overall_processed_yr = Number($("#edit-field-overall-xiib-proc-start-yr-0-value").val());
                  var overall_pend_end_yr = overall_pend_start_yr + overall_con_during_yr - overall_processed_yr;
                  $('#edit-field-overall-xiib-pend-end-yr-0-value').val(overall_pend_end_yr);
              });

          });

          // Fields from IX and X to calculate field_perc_costs per agency.
          //FOIA Personnel and Costs IX. proc_costs / Fees X. total_fees  = Fees X. perc_costs
          var ix_section = $('a[href="#edit-group-ix-foia-personnel-cost-wra"]');
          ix_section.click(function() {
              $( "input[name*='field_foia_pers_costs_ix']").filter("input[name*='field_proc_costs']").each(function() {
                  console.log(this);
                  // Get all IX sections.
                  // For each IX section create .change function on proc_costs field.
                  this.onchange(function(){
                      var proc_costs_val = this.val();
                      console.log(proc_costs_val);
                  });
              });

          });

          var x_section = $('a[href="#edit-group-x-fees-collected-for-proce"]');
          x_section.click(function() {
              $( "input[name*='field_fees_x']").filter("input[name*='field_total_fees']").each(function() {
                  console.log(this);
                  // Get all X sections
                  // For each X section create .change function on total_fees field.
              });

          });

          // Create function that calcs perc_costs from sum of changed field and the corresponding input field.
          function calcPercCosts(changed, input, target) {
              // Get ID of changed field.

              // Get value of corresponding agency_component field.

              // Get ID of corresponding input field based on agency_component field.

              // Calculate perc_costs from values of changed and input fields.

          }

          // Gets ID of changed field.
          function fieldIdCheck(changed) {
              console.log(changed);

          }

          // Gets agency_component field for given field.
          function getAgencyComponent(changed) {
              console.log(changed);
          }

          // Get input field based on changed field ID and agency_component value.
          function getCalcField(changed, agency) {
              console.log(changed);
              console.log(agency);
          }

          //


      }
  }
})(jQuery, drupalSettings, Drupal);
