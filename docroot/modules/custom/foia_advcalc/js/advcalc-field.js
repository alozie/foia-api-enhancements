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

          // // Fields from section V A to calculate field_req_pend_end_yr.
          // // Fields from XII B to calculate field_pend_end_yr.
          // // Fields from IX and X to calculate field_perc_costs per agency.

      }
  }
})(jQuery, drupalSettings, Drupal);
