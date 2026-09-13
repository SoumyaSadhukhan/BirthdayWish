using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using System;

namespace Piu.Pages;

public class IndexModel : PageModel
{
    private readonly IConfiguration _configuration;

    public string TargetDate { get; set; } = "";

    public IndexModel(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public void OnGet()
    {
        TargetDate = _configuration["BirthdayConfig:TargetDate"] ?? DateTime.UtcNow.AddDays(1).ToString("O");
    }
}
